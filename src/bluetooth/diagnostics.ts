import {Platform} from 'react-native';
import {transport,NativeBLETransport} from './transport';
import {BLEDeviceInfo} from './types';
import {diagnosticBytes,DiagnosticService} from '../core/bluetoothDiagnostics';
const manager=()=> (transport as NativeBLETransport).getDiagnosticManager();
export async function chooseDiagnosticDevice(_services:string[]):Promise<BLEDeviceInfo>{throw new Error('Choose a device from the scan results.');}
export async function scanDiagnosticDevices(onDevice:(d:BLEDeviceInfo)=>void,onError:(e:Error)=>void){await transport.ready(true);return transport.scan([],onDevice,onError);}
export async function inspectDiagnosticDevice(device:BLEDeviceInfo,_services:string[]):Promise<{services:DiagnosticService[];limitations:string[]}>{
 if(await manager().isDeviceConnected(device.id))throw new Error('Disconnect the vehicle before inspecting it.');
 const d=await manager().connectToDevice(device.id,{timeout:10000,autoConnect:false});
 try{await d.discoverAllServicesAndCharacteristics();const services:DiagnosticService[]=[];let reads=0;const deadline=Date.now()+90000;
 for(const service of await d.services()){const entry:DiagnosticService={uuid:service.uuid,characteristics:[]};services.push(entry);try{for(const c of await service.characteristics()){const row={uuid:c.uuid,properties:{read:c.isReadable,write:c.isWritableWithResponse,writeWithoutResponse:c.isWritableWithoutResponse,notify:c.isNotifiable,indicate:c.isIndicatable},value:undefined as ReturnType<typeof diagnosticBytes>|undefined,error:undefined as string|undefined};entry.characteristics.push(row);if(c.isReadable&&reads++<32&&Date.now()<deadline){const transaction=`diagnostic-${Date.now()}-${reads}`,timer=setTimeout(()=>void manager().cancelTransaction(transaction),3000);try{const value=await c.read(transaction);row.value=diagnosticBytes(value.value?Uint8Array.from(atob(value.value),x=>x.charCodeAt(0)):undefined);}catch(e){row.error=e instanceof Error?e.message:String(e);}finally{clearTimeout(timer);}}}}catch(e){entry.error=e instanceof Error?e.message:String(e);}}
 return {services,limitations:[`Read-only GATT inspection on ${Platform.OS}. No writes, notifications, firmware changes or protocol authentication were performed.`, 'Readable values may contain identifying information such as serial numbers. Review before sharing.']};
 }finally{await manager().cancelDeviceConnection(device.id).catch(()=>{});}
}
export const diagnosticsUseChooser=false;
