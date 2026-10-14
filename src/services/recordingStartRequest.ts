let requestedAt=0,redirect:string|null=null;const listeners=new Set<()=>void>();
/** An in-app consent action, never a public deep-link parameter. */
export function requestRecordingStart(externalUrl?:string){redirect=externalUrl??null;requestedAt=Date.now();for(const listener of listeners)listener();}
export function consumeRecordingStart(){const requested=requestedAt>0&&Date.now()-requestedAt<10000;requestedAt=0;return requested;}

export function subscribeRecordingStart(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}

export function takeRecordingRedirect(){const value=redirect;redirect=null;return value;}
