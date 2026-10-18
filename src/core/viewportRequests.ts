/** Shared, reference-counted requests: off-screen work is cancelled, active work is bounded. */
export class ViewportRequests<T> {
  private entries = new Map<string, {refs:number;controller:AbortController;running:boolean;promise:Promise<T>;resolve:(value:T)=>void;reject:(error:Error)=>void}>();
  private cache = new Map<string, {value:T;weight:number}>();
  private running = 0;
  private weight = 0;
  constructor(private load:(key:string,signal:AbortSignal)=>Promise<T>, private size:(value:T)=>number, private budget=60000, private concurrency=2) {}
  acquire(key:string) {
    const cached=this.cache.get(key);
    if(cached){this.cache.delete(key);this.cache.set(key,cached);return {promise:Promise.resolve(cached.value),release:()=>{}};}
    let entry=this.entries.get(key);
    if(!entry){
      let resolve!:(value:T)=>void,reject!:(error:Error)=>void;
      const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});
      entry={refs:0,controller:new AbortController(),running:false,promise,resolve,reject};this.entries.set(key,entry);
    }
    entry.refs++;this.pump();let released=false;const owned=entry;
    return {promise:owned.promise,release:()=>{
      if(released)return;released=true;owned.refs--;
      if(owned.refs===0&&this.entries.get(key)===owned){this.entries.delete(key);owned.controller.abort();owned.reject(new Error('Viewport request cancelled'));this.pump();}
    }};
  }
  private pump(){
    for(const [key,entry] of this.entries){
      if(this.running>=this.concurrency)return;
      if(entry.running||entry.refs===0)continue;
      entry.running=true;this.running++;
      void Promise.resolve().then(()=>{if(entry.controller.signal.aborted)throw new Error('Viewport request cancelled');return this.load(key,entry.controller.signal);}).then(value=>{
        if(entry.controller.signal.aborted||this.entries.get(key)!==entry)return;
        const weight=this.size(value);
        if(Number.isFinite(weight)&&weight>0&&weight<=this.budget){
          while(this.cache.size&&(this.weight+weight>this.budget||this.cache.size>=20)){const first=this.cache.keys().next().value!;this.weight-=this.cache.get(first)!.weight;this.cache.delete(first);}
          this.cache.set(key,{value,weight});this.weight+=weight;
        }
        entry.resolve(value);
      },error=>entry.reject(error instanceof Error?error:new Error(String(error)))).finally(()=>{
        if(this.entries.get(key)===entry)this.entries.delete(key);this.running--;this.pump();
      });
    }
  }
}
