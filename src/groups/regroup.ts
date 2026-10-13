import {RIDER_ID} from './model';
export interface RegroupRequest {id:string;by:string;at:number;active:boolean;}
export function readRegroup(raw:unknown):RegroupRequest|null{const r=raw as RegroupRequest;return r&&typeof r.id==='string'&&/^[A-Za-z0-9-]{1,100}$/.test(r.id)&&RIDER_ID.test(r.by)&&Number.isFinite(r.at)&&r.at>=0&&typeof r.active==='boolean'?{id:r.id,by:r.by,at:r.at,active:r.active}:null;}
export function latestRegroup(a:RegroupRequest|undefined,b:RegroupRequest|undefined){return !a?b:!b?a:b.at>a.at||b.at===a.at&&b.id>a.id?b:a;}
export function activeRegroup(r:RegroupRequest|undefined,now=Date.now()){return r?.active&&r.at<=now+5000&&now-r.at<600000?r:undefined;}
