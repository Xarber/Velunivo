/** Web-only AsyncStorage adapter. One atomic migration; no large values remain in localStorage. */
let ready:Promise<IDBDatabase>|undefined;
const listeners=new Set<(keys:string[])=>void>();
const channel=typeof window!=='undefined'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('velunivo-storage-v1'):null;
if(channel)channel.onmessage=e=>{if(e.data===null&&typeof window!=='undefined'){window.dispatchEvent(new StorageEvent('storage',{key:null}));return;}if(!Array.isArray(e.data))return;for(const key of e.data)if(typeof key==='string'&&typeof window!=='undefined')window.dispatchEvent(new StorageEvent('storage',{key}));};
function database(){return ready??=new Promise<IDBDatabase>((resolve,reject)=>{
 if(typeof indexedDB==='undefined'){reject(new Error('Browser storage is unavailable. Use a browser with IndexedDB enabled.'));return;}
 const request=indexedDB.open('velunivo-data',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('values');
 request.onerror=()=>{ready=undefined;reject(request.error);};
 request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();ready=undefined;};const legacy:[string,string][]=[];
 try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!==null){const v=localStorage.getItem(k);if(v!==null)legacy.push([k,v]);}}}catch{/* IndexedDB can still work when legacy storage is inaccessible. */}
 if(!legacy.length){resolve(db);return;}
 const tx=db.transaction('values','readwrite'),store=tx.objectStore('values');
 for(const [k,v] of legacy){const old=store.get(k);old.onsuccess=()=>{if(old.result===undefined)store.put(v,k);};}
 tx.oncomplete=()=>{try{for(const [k,v] of legacy)if(localStorage.getItem(k)===v)localStorage.removeItem(k);}catch{}resolve(db);};
 tx.onabort=()=>{ready=undefined;db.close();reject(tx.error??new Error('Storage migration failed. Existing data was preserved.'));};
 };
 });}
function friendly(error:unknown){return error instanceof DOMException&&error.name==='QuotaExceededError'?new Error('Browser storage is full. Export a backup or remove saved media to free space.'):error;}
async function read(keys:readonly string[]){const db=await database();return new Promise<[string,string|null][]>((resolve,reject)=>{const tx=db.transaction('values'),store=tx.objectStore('values'),out:[string,string|null][]=keys.map(k=>[k,null]);keys.forEach((k,i)=>{const r=store.get(k);r.onsuccess=()=>out[i][1]=typeof r.result==='string'?r.result:null;});tx.oncomplete=()=>resolve(out);tx.onabort=()=>reject(friendly(tx.error));});}
async function write(pairs:readonly (readonly [string,string])[],remove:readonly string[]=[],clear=false){const db=await database();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('values','readwrite'),store=tx.objectStore('values');if(clear)store.clear();for(const k of remove)store.delete(k);for(const [k,v] of pairs){if(typeof k!=='string'||typeof v!=='string'){tx.abort();reject(new Error('Storage keys and values must be strings.'));return;}store.put(v,k);}tx.oncomplete=()=>{const keys=[...pairs.map(([k])=>k),...remove];channel?.postMessage(clear?null:keys);for(const listener of listeners)listener(keys);resolve();};tx.onabort=()=>reject(friendly(tx.error));});}
function merge(a:unknown,b:unknown):unknown{if(Array.isArray(a)&&Array.isArray(b))return [...a,...b];if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){const out:Record<string,unknown>={...a};for(const [k,v] of Object.entries(b))if(!['__proto__','constructor','prototype'].includes(k))out[k]=merge(out[k],v);return out;}return b;}
type Callback<T=void>=(error:Error|null,result?:T)=>void;
function callback<T>(promise:Promise<T>,cb?:Callback<T>){if(cb)void promise.then(v=>cb(null,v),e=>cb(e));return promise;}
const storage={
 getItem:(key:string,cb?:Callback<string|null>)=>callback(read([key]).then(v=>v[0][1]),cb),
 setItem:(key:string,value:string,cb?:Callback)=>callback(write([[key,value]]),cb),
 removeItem:(key:string,cb?:Callback)=>callback(write([],[key]),cb),
 multiGet:(keys:readonly string[],cb?:Callback<[string,string|null][]>)=>callback(read(keys),cb),
 multiSet:(pairs:readonly (readonly [string,string])[],cb?:Callback)=>callback(write(pairs),cb),
 multiRemove:(keys:readonly string[],cb?:Callback)=>callback(write([],keys),cb),
 clear:(cb?:Callback)=>callback(write([],[],true),cb),
 getAllKeys:(cb?:Callback<string[]>)=>callback(database().then(db=>new Promise<string[]>((resolve,reject)=>{const tx=db.transaction('values'),r=tx.objectStore('values').getAllKeys();tx.oncomplete=()=>resolve(r.result.map(String));tx.onabort=()=>reject(tx.error);})),cb),
 mergeItem:async(key:string,value:string,cb?:Callback)=>callback(storage.getItem(key).then(old=>storage.setItem(key,JSON.stringify(merge(old?JSON.parse(old):{},JSON.parse(value))))),cb),
 multiMerge:async(pairs:readonly (readonly [string,string])[],cb?:Callback)=>callback(Promise.all(pairs.map(([k,v])=>storage.mergeItem(k,v))).then(()=>{}),cb),
 flushGetRequests:()=>{}
};
export const useAsyncStorage=(key:string)=>({getItem:()=>storage.getItem(key),setItem:(value:string)=>storage.setItem(key,value),removeItem:()=>storage.removeItem(key),mergeItem:(value:string)=>storage.mergeItem(key,value)});
export default storage;
