import {BLELink, BLETransport, VehicleProtocolPlugin} from './types';

/** A recoverable physical-approval failure, distinct from unsupported protocols and permissions. */
export class VehicleApprovalRequiredError extends Error {}
type Context = Parameters<VehicleProtocolPlugin['open']>[1];
const pause = (ms:number,signal?:AbortSignal) => new Promise<void>((resolve,reject)=>{
 if(signal?.aborted){reject(new Error('Connection cancelled'));return;}
 const stop=()=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);reject(new Error('Connection cancelled'));};
 const timer=setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve();},ms);
 signal?.addEventListener('abort',stop,{once:true});
});
/** Retry physical approval with a new radio/protocol session, never a reused crypto session. */
export async function openWithApprovalRetry(plugin:VehicleProtocolPlugin,initial:BLELink,transport:BLETransport,ctx:Context,onLink:(link:BLELink)=>void,timing={now:Date.now,sleep:pause,windowMs:30000,intervalMs:5000}){
 let link=initial;const deadline=timing.now()+timing.windowMs;
 for(;;){
  if(ctx.signal?.aborted)throw new Error('Connection cancelled');
  const started=timing.now();
  try{return {link,session:await plugin.open(link,{...ctx,approvalDeadline:Math.min(deadline,started+timing.intervalMs)})};}
  catch(error){
   if(!(error instanceof VehicleApprovalRequiredError) || ctx.signal?.aborted)throw error;
   await link.disconnect().catch(()=>{});
   if(timing.now()>=deadline)throw new VehicleApprovalRequiredError('Headlight approval was not confirmed within 30 seconds. Turn on the headlight, then try again.');
   ctx.phase('Turn on the headlight. Reconnecting automatically every 5 seconds for up to 30 seconds…');
   await timing.sleep(Math.max(0,started+timing.intervalMs-timing.now()),ctx.signal);
   if(timing.now()>=deadline)throw new VehicleApprovalRequiredError('Headlight approval was not confirmed within 30 seconds. Turn on the headlight, then try again.');
   if(ctx.signal?.aborted)throw new Error('Connection cancelled');
   link=await transport.connect(initial.device);onLink(link);
  }
 }
}
