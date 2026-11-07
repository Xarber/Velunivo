// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect,useRef,useSyncExternalStore} from 'react';
import {SHOW_WEB_LANDING,WEB_ENTRY_KEY,shouldShowWebLanding,validWebEntryMessage} from '../core/webEntry';
import {t} from '../i18n/core';
type Entry={showLanding:boolean;appMounted:boolean};
let entry:Entry|null=null;
const listeners=new Set<()=>void>();
const subscribe=(notify:()=>void)=>{listeners.add(notify);return()=>{listeners.delete(notify);};};
function snapshot(){
 if(!entry&&typeof window!=='undefined'){
  let opened=false;try{opened=window.localStorage.getItem(WEB_ENTRY_KEY)==='true';}catch{/* Storage may be blocked. */}
  const showLanding=shouldShowWebLanding(window.location.pathname,window.location.search,opened);entry={showLanding,appMounted:!showLanding};
 }
 return entry;
}
function update(next:Entry){entry=next;for(const notify of listeners)notify();}
function rememberOpen(){try{window.localStorage.setItem(WEB_ENTRY_KEY,'true');}catch{/* Still works for this session. */}}
export default function WebEntryGate({children}:{children:React.ReactNode}){
 const frame=useRef<HTMLIFrameElement>(null),state=useSyncExternalStore(subscribe,snapshot,()=>null);
 useEffect(()=>{
  if(state?.appMounted){rememberOpen();const url=new URL(window.location.href);if(url.searchParams.has('landing')||url.searchParams.has('openApp')){url.searchParams.delete('landing');url.searchParams.delete('openApp');window.history.replaceState(window.history.state,'',url);}}
 },[state?.appMounted]);
 useEffect(()=>{
  const show=()=>update({showLanding:true,appMounted:snapshot()?.appMounted??false});
  const receive=(event:MessageEvent)=>{if(validWebEntryMessage(event,window.location.origin,frame.current?.contentWindow)){rememberOpen();update({showLanding:false,appMounted:true});}};
  window.addEventListener(SHOW_WEB_LANDING,show);window.addEventListener('message',receive);
  return()=>{window.removeEventListener(SHOW_WEB_LANDING,show);window.removeEventListener('message',receive);};
 },[]);
 return <>{state?.appMounted&&<div inert={state.showLanding} aria-hidden={state.showLanding} style={{position:'absolute',inset:0,display:'flex',flexDirection:'column'}}>{children}</div>}{state?.showLanding&&<iframe ref={frame} title={t('About Velunivo')} src="/about.html?embedded=1" style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0,zIndex:2147483647,background:'#101b21'}}/>}</>;
}
