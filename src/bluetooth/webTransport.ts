import {AdapterState,BLEDeviceInfo,BLELink,BLETransport,ManufacturerDiscoveryFilter} from './types';
// Narrow structural Web Bluetooth types keep this module testable without browser globals.
export interface WebCharacteristic {
 value?:DataView; startNotifications():Promise<unknown>; stopNotifications():Promise<unknown>;
 writeValueWithoutResponse?(data:Uint8Array):Promise<void>; writeValue?(data:Uint8Array):Promise<void>;
 addEventListener(event:string,listener:()=>void):void; removeEventListener(event:string,listener:()=>void):void;
}
interface WebService {getCharacteristic(uuid:string):Promise<WebCharacteristic>;}
export interface WebDevice {
 id:string;name?:string;gatt?:{connected:boolean;connect():Promise<unknown>;disconnect():void;getPrimaryService(uuid:string):Promise<WebService>};
 addEventListener(event:string,listener:()=>void):void;removeEventListener(event:string,listener:()=>void):void;
}
export interface WebBluetooth {
 requestDevice(options:{filters:({services:string[]}|{manufacturerData:{companyIdentifier:number;dataPrefix:Uint8Array}[]})[];optionalServices:string[]}):Promise<WebDevice>;
 getDevices?():Promise<WebDevice[]>;
}
export function browserBluetooth():WebBluetooth|undefined {return typeof navigator==='undefined'?undefined:(navigator as Navigator & {bluetooth?:WebBluetooth}).bluetooth;}
export function webBluetoothAvailable(){return !!browserBluetooth() && typeof window!=='undefined' && window.isSecureContext;}
function bounded<T>(operation:Promise<T>,message:string,late?:()=>void):Promise<T>{let expired=false;return new Promise<T>((resolve,reject)=>{const timer=setTimeout(()=>{expired=true;reject(new Error(message));},12000);operation.then(value=>{clearTimeout(timer);if(expired)late?.();else resolve(value);},error=>{clearTimeout(timer);if(!expired)reject(error);});});}
const errorMessage=(e:unknown)=>e instanceof Error?e:new Error(String(e));
export class WebBLETransport implements BLETransport {
 private devices=new Map<string,WebDevice>();
 constructor(private api:()=>WebBluetooth|undefined=browserBluetooth,private secure:()=>boolean=()=>typeof window!=='undefined' && window.isSecureContext){}
 async ready(_requestPermission:boolean){if(!this.secure())throw new Error('Web Bluetooth needs HTTPS (or localhost).');if(!this.api())throw new Error('Open Velunivo in Bluefy on iPhone/iPad, or a browser with Web Bluetooth on Android/desktop. Firefox, Safari and Safari-installed PWAs do not expose Bluetooth.');}
 observeState(listener:(state:AdapterState)=>void){listener(this.api() && this.secure()?'Unknown':'Unsupported');return()=>{};}
 // Called directly from a button, before any await, to preserve browser user activation.
 chooseDevice(services:string[],manufacturerFilters:readonly ManufacturerDiscoveryFilter[]=[]):Promise<BLEDeviceInfo>{
  if(!this.secure() || !this.api())return this.ready(true).then(()=>{throw new Error('Bluetooth unavailable');});
  const filters:Parameters<WebBluetooth['requestDevice']>[0]['filters']=[...services.map(service=>({services:[service]})),...manufacturerFilters.map(filter=>({manufacturerData:[{companyIdentifier:filter.companyIdentifier,dataPrefix:Uint8Array.from(filter.dataPrefix)}]}))];
  return this.api()!.requestDevice({filters,optionalServices:services}).then(device=>{this.devices.set(device.id,device);return {id:device.id,name:device.name ?? null,rssi:null,services,connectable:true,discoverySource:'web-gatt' as const};}).catch(e=>{if(e?.name==='NotFoundError')throw new Error('The browser chooser closed without a device. Use Chrome/Edge on desktop or Android, or Bluefy on iOS. Check Bluetooth, switch on the vehicle and close other scooter apps, then retry.');throw errorMessage(e);});
 }
 async scan(_services:string[],_listener:(device:BLEDeviceInfo)=>void,_error:(e:Error)=>void):Promise<()=>void>{throw new Error('Use the browser device chooser to connect.');}
 async connect(info:BLEDeviceInfo):Promise<BLELink>{
  await this.ready(false);let device=this.devices.get(info.id);
  if(!device && this.api()?.getDevices){device=(await this.api()!.getDevices!()).find(d=>d.id===info.id);if(device)this.devices.set(device.id,device);}
  if(!device?.gatt)throw new Error('Browser device permission is unavailable. Choose Replace device to select your vehicle again.');
  const selected=device,gatt=device.gatt;await bounded(gatt.connect(),'Bluetooth connection timed out. Move closer and retry.',()=>gatt.disconnect());
  const characteristics=new Map<string,Promise<WebCharacteristic>>(),cleanups=new Set<()=>void>(),listeners=new Set<(error?:Error)=>void>();let ended=false;
  const characteristic=(service:string,id:string)=>{const key=`${service}/${id}`;let found=characteristics.get(key);if(!found){found=bounded(gatt.getPrimaryService(service).then(s=>s.getCharacteristic(id)),'Bluetooth service discovery timed out.');characteristics.set(key,found);}return found;};
  const disconnected=()=>{if(ended)return;ended=true;for(const stop of cleanups)stop();selected.removeEventListener('gattserverdisconnected',disconnected);for(const listener of listeners)listener();listeners.clear();};
  selected.addEventListener('gattserverdisconnected',disconnected);
  let notificationReady:Promise<void>=Promise.resolve(),writes:Promise<void>=Promise.resolve();
  return {device:info,hasCharacteristic:async(s,c)=>{try{await characteristic(s,c);return true;}catch(error){if(error instanceof Error && error.name==='NotFoundError')return false;throw errorMessage(error);}},
   monitor(s,c,receive,onError){let stopped=false,char:WebCharacteristic|undefined;const changed=()=>{if(stopped || !char?.value)return;const value=char.value;receive(new Uint8Array(value.buffer,value.byteOffset,value.byteLength).slice());};
    const stop=()=>{stopped=true;if(char){char.removeEventListener('characteristicvaluechanged',changed);if(gatt.connected)void char.stopNotifications().catch(()=>{});}cleanups.delete(stop);};cleanups.add(stop);
    notificationReady=characteristic(s,c).then(async value=>{char=value;if(stopped)return;char.addEventListener('characteristicvaluechanged',changed);await bounded(char.startNotifications(),'Bluetooth notifications could not start.',()=>{void value.stopNotifications().catch(()=>{});});if(stopped){char.removeEventListener('characteristicvaluechanged',changed);if(gatt.connected)await char.stopNotifications();}});
    void notificationReady.catch(e=>{if(!stopped)onError(errorMessage(e));});return stop;
   },
   write(s,c,data){const bytes=data.slice();const operation=writes.then(async()=>{await notificationReady;if(ended || !gatt.connected)throw new Error('Bluetooth device disconnected');const char=await characteristic(s,c);for(let offset=0;offset<bytes.length;offset+=20){const chunk=bytes.slice(offset,offset+20);if(char.writeValueWithoutResponse)await bounded(char.writeValueWithoutResponse(chunk),'Bluetooth write timed out.');else if(char.writeValue)await bounded(char.writeValue(chunk),'Bluetooth write timed out.');else throw new Error('This browser cannot write to the vehicle data service.');}});writes=operation.catch(()=>{});return operation;},
   onDisconnect(listener){listeners.add(listener);return()=>{listeners.delete(listener);};},
   async disconnect(){for(const stop of [...cleanups])stop();gatt.disconnect();disconnected();},readRSSI:async()=>null};
 }
}
