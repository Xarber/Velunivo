import {AssociationStorage} from './bridge';
import {Association} from './types';
interface BrowserStorage {getItem(key:string):Promise<string|null>;setItem(key:string,value:string):Promise<unknown>;}
const key='velunivo-web-ble-associations-v1';
export function createBrowserAssociationStorage(storage:BrowserStorage):AssociationStorage {
 return {async load(){const raw=await storage.getItem(key);if(!raw)return [];try{const records:unknown=JSON.parse(raw);if(!Array.isArray(records))return [];return records.filter((a):a is Association=>!!a && a.schema===1 && typeof a.vehicleId==='string' && typeof a.pluginId==='string' && typeof a.device?.id==='string').map(a=>({...a,device:{...a.device,manufacturerData:a.device.manufacturerData?Uint8Array.from(Object.values(a.device.manufacturerData)):undefined}}));}catch{return [];}},async save(records){await storage.setItem(key,JSON.stringify(records.map(a=>({...a,device:{...a.device,serviceData:undefined}}))));}};
}
