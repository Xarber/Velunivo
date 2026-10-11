export interface RideNotice {title:string;message:string;confirm?:()=>void}
const listeners=new Set<(notice:RideNotice)=>void>();
export function notifyRideNotice(notice:RideNotice){for(const listener of listeners)listener(notice);}
export function notifyShortRide(){notifyRideNotice({title:'Ride not saved',message:'Looks like you didn’t move much. This ride won’t be saved.'});}
export function subscribeRideNotices(listener:(notice:RideNotice)=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
