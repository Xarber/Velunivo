/** BLE-PLX adapter operations, kept independent of React Native for failure-path tests. */
export interface NativeCharacteristicInfo {
 uuid:string; isNotifying:boolean; isWritableWithResponse:boolean; isWritableWithoutResponse:boolean;
}
export interface NativeWriteDevice {
 characteristicsForService(service:string):Promise<NativeCharacteristicInfo[]>;
 writeCharacteristicWithResponseForService(service:string,characteristic:string,value:string,transaction:string):Promise<unknown>;
 writeCharacteristicWithoutResponseForService(service:string,characteristic:string,value:string,transaction:string):Promise<unknown>;
}
let transactionSequence=0;
export function nativeOperations(device:NativeWriteDevice,cancel:(id:string)=>Promise<unknown>,confirmNotifications:boolean,timing={timeout:5000,poll:80}){
 let ended=false,writes:Promise<void>=Promise.resolve(),notificationReady:Promise<void>=Promise.resolve();
 const transactions=new Set<string>();
 const bounded=async<T>(operation:Promise<T>,message:string,onTimeout?:()=>void):Promise<T>=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([operation,new Promise<never>((_,reject)=>{timer=setTimeout(()=>{onTimeout?.();reject(new Error(message));},timing.timeout);})]);}
  finally{clearTimeout(timer);}
 };
 const characteristic=async(service:string,id:string)=>{
  const found=(await bounded(device.characteristicsForService(service),'Bluetooth service discovery timed out.')).find(c=>c.uuid.toLowerCase()===id.toLowerCase());
  if(!found)throw new Error('This device does not expose the supported vehicle data service.');return found;
 };
 return {
  /** CoreBluetooth's isNotifying becomes true only after the CCCD subscription succeeds. */
  monitorStarted(service:string,id:string,isStopped:()=>boolean,onError:(error:Error)=>void){
   if(!confirmNotifications)return;
   const ready=(async()=>{const deadline=Date.now()+timing.timeout;while(!ended&&!isStopped()){
    if((await characteristic(service,id)).isNotifying)return;
    if(Date.now()>=deadline)throw new Error('Bluetooth notifications could not start.');
    await new Promise<void>(resolve=>setTimeout(resolve,timing.poll));
   }throw new Error('Bluetooth session closed');})();
   notificationReady=Promise.all([notificationReady,ready]).then(()=>{});
   void ready.catch(error=>{if(!ended&&!isStopped())onError(error instanceof Error?error:new Error('Bluetooth notifications could not start.'));});
   // Writes will observe this rejection; attach a handler now to avoid an unhandled promise.
   void notificationReady.catch(()=>{});
  },
  write(service:string,id:string,bytes:Uint8Array){
   const copy=bytes.slice();const operation=writes.then(async()=>{
    await notificationReady;if(ended)throw new Error('Bluetooth session closed');
    const c=await characteristic(service,id);
    if(!c.isWritableWithoutResponse&&!c.isWritableWithResponse)throw new Error('This device does not support writing to the vehicle data service.');
    for(let offset=0;offset<copy.length;offset+=20){
     if(ended)throw new Error('Bluetooth session closed');
     const transaction=`velunivo-write-${++transactionSequence}`;transactions.add(transaction);
     const value=btoa(String.fromCharCode(...copy.slice(offset,offset+20)));
     try{await bounded(c.isWritableWithoutResponse?device.writeCharacteristicWithoutResponseForService(service,id,value,transaction):device.writeCharacteristicWithResponseForService(service,id,value,transaction),'Bluetooth write timed out.',()=>{void cancel(transaction).catch(()=>{});});}
     finally{transactions.delete(transaction);}
    }
   });writes=operation.catch(()=>{});return operation;
  },
  close(){ended=true;for(const id of transactions)void cancel(id).catch(()=>{});transactions.clear();}
 };
}
