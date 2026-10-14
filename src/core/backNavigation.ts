/** Tab history is not a parent page. Pop only a real stack; otherwise replace with the parent. */
export function backOrParent<T>(navigation:{canGoBack():boolean;canDismiss():boolean;back():void;replace(parent:T):void},parent:T){if(navigation.canDismiss()&&navigation.canGoBack())navigation.back();else navigation.replace(parent);}
