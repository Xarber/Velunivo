// SPDX-License-Identifier: AGPL-3.0-only
export const WEB_ENTRY_KEY='velunivo-web-opened-v1';
export const SHOW_WEB_LANDING='velunivo:show-landing';
export const OPEN_WEB_APP='velunivo:open-web-app';
/** Only ordinary home visits get the introduction. Never intercept application/deep links. */
export function shouldShowWebLanding(pathname:string,search:string,opened:boolean){
 if(pathname!=='/'&&pathname!=='/index.html')return false;
 const query=new URLSearchParams(search);
 if(query.get('openApp')==='1')return false;
 if(query.get('landing')==='1')return true;
 if([...query.keys()].some(key=>key!=='source'&&key!=='landing'&&!key.startsWith('utm_')))return false;
 return !opened;
}
export function validWebEntryMessage(event:{origin:string;source:unknown;data:unknown},origin:string,frame:unknown){return !!frame&&event.origin===origin&&event.source===frame&&event.data===OPEN_WEB_APP;}
