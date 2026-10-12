/** Serialize activation and release so an ending ride cannot leave a late wake lock behind. */
export function screenWakeLease(activate:()=>Promise<void>,deactivate:()=>Promise<void>){
 let active=true,acquired=false,pending:Promise<void>=Promise.resolve();
 const release=async()=>{if(acquired){acquired=false;await deactivate().catch(()=>{});}};
 const refresh=()=>{pending=pending.then(async()=>{await release();if(!active)return;try{await activate();acquired=true;}catch{/* Unsupported/denied wake locks must not block navigation. */}if(!active)await release();});return pending;};
 void refresh();
 return {refresh,dispose(){active=false;pending=pending.then(release);return pending;}};
}
