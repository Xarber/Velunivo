/** Save the outgoing local session before adopting a group's activity.
 * Keep membership while React tears down its GPS/recording effects. */
let replacing=false;
let current:{finish:()=>Promise<boolean>;stopped:Promise<void>;release:()=>void}|undefined;
export const isReplacingGroupActivity=()=>replacing;
export const hasRideActivity=()=>!!current;
export function registerRideActivity(finish:()=>Promise<boolean>){
 let release!:()=>void;const stopped=new Promise<void>(resolve=>{release=resolve;});
 const entry={finish,stopped,release};current=entry;replacing=false;
 return()=>{if(current===entry)current=undefined;release();};
}
export function cancelGroupActivityReplacement(){replacing=false;}
export async function prepareGroupActivityReplacement(){
 if(replacing)return false;
 replacing=true;const outgoing=current;
 try{if(outgoing){if(!await outgoing.finish()){replacing=false;return false;}await outgoing.stopped;}return true;}
 catch(error){replacing=false;throw error;}
}
