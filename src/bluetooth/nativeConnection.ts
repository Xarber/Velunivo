// SPDX-License-Identifier: AGPL-3.0-only
/** Keep iOS background connects pending in CoreBluetooth, rather than expiring
 * before the scooter comes back. A user disconnect must still cancel them. */
export const nativeConnectOptions=(ios:boolean,background:boolean)=>({autoConnect:false,...! (ios&&background)&&{timeout:10000}});
export async function abortableNativeConnect<T>(connect:()=>Promise<T>,cancel:()=>Promise<unknown>,signal?:AbortSignal):Promise<T>{
 if(signal?.aborted)throw new Error('Connection cancelled');
 let stop=()=>{};
 const aborted=new Promise<never>((_,reject)=>{stop=()=>{void cancel().catch(()=>{});reject(new Error('Connection cancelled'));};signal?.addEventListener('abort',stop,{once:true});});
 try{return await Promise.race([connect().then(value=>{if(signal?.aborted){void cancel().catch(()=>{});throw new Error('Connection cancelled');}return value;}),aborted]);}
 finally{signal?.removeEventListener('abort',stop);}
}
