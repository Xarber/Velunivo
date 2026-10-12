let pending=false;const listeners=new Set<()=>void>();
export function requestRideSimulation(){pending=true;for(const listener of listeners)listener();}
export function takeRideSimulation(){const value=pending;pending=false;return value;}
export function subscribeRideSimulation(listener:()=>void){listeners.add(listener);if(pending)listener();return()=>{listeners.delete(listener);};}
