import {t} from '../i18n/core';
import {NavigationActivity} from './liveActivity';
export type AndroidActivityId='velunivo-navigation'|'velunivo-spectator'|'velunivo-test'|'velunivo-recording';
export interface AndroidLiveContent {body:string;chip:string;url:string;updatedAt:number;oldLabel:string;}
/** Public viewer displays intentionally omit all private vehicle metrics even if supplied accidentally. */
export function androidLiveContent(id:AndroidActivityId,p:NavigationActivity,url:string,oldLabel:string,viewerLabel:string,now=Date.now()):AndroidLiveContent{
 const extras=id==='velunivo-spectator'?'':`${p.batteryPercent!==undefined?` · ${p.batteryPercent}%${p.batteryOld?` (${p.oldLabel||oldLabel})`:''}`:''}${p.viewerCount!==undefined?` · ${p.viewerCount} ${viewerLabel}`:''}${p.groupCount!==undefined?` · ${p.groupCount} ${t('riders')}`:''}`;
 return {body:`${id!=='velunivo-spectator'&&p.regroup?p.regroup+'\n':''}${id!=='velunivo-spectator'&&p.joinRequest?t('Join request')+' · '+p.joinRequest+'\n':''}${p.turn} · ${p.distance}\n${p.arrival} · ${p.minutes} · ${p.remaining}${extras}`,chip:p.minutes.trim().slice(0,7),url,updatedAt:p.updatedAt??now,oldLabel};
}
