/** Local native notifications do not request web push subscriptions. */
export async function requestLocalNotifications(){return false;}
export async function notifyRideEvent(_id:string,_title:string,_body:string){}
