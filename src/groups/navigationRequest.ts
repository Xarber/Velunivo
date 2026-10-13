let pending:string|null=null;const listeners=new Set<()=>void>();
export function requestGroupNavigation(routeId:string){pending=routeId;for(const listener of listeners)listener();}
export function takeGroupNavigation(routeId:string){if(pending!==routeId)return false;pending=null;return true;}
export function subscribeGroupNavigation(listener:()=>void){listeners.add(listener);if(pending)listener();return()=>{listeners.delete(listener);};}
