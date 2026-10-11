import {resolveShareOrigin} from '../sharing/hostConfig';
// Canonical HTTPS and custom scheme links resolve to the same web/native screens.
export function redirectSystemPath({path}:{path:string;initial:boolean}){
 try{const u=new URL(path,'velunivo://app');if(u.protocol==='velunivo:' && u.hostname==='share')return `/share${u.pathname}${u.search}`;if(u.protocol==='https:'&&u.hostname===new URL(resolveShareOrigin(process.env.EXPO_PUBLIC_SHARE_ORIGIN)).hostname&&u.pathname.startsWith('/share/'))return `${u.pathname}${u.search}`;return path;}catch{return '/';}
}
