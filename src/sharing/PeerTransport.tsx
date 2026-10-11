import React,{useEffect,useMemo,useRef,useCallback,useState,useLayoutEffect} from 'react';
import {RecoveryScheduler} from './recovery';
import {View,AppState} from 'react-native';
import {WebView} from 'react-native-webview';
import {nativePeerHtml} from './nativePeerHtml';
import {parseTripMessage,SHARE_ORIGIN} from './model';
import {TransportProps} from './transportTypes';
// Native WebRTC data channels run in WKWebView/Android WebView, with no media permissions.
export default function PeerTransport({role,pin,viewerId,messages,onMessage,onStatus,onReady,onViewers}:TransportProps){
 const [revision,setRevision]=useState(0),recovery=useRef<RecoveryScheduler|null>(null),probe=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const callbacks=useRef({onStatus,onReady,onViewers,onMessage});useEffect(()=>{callbacks.current={onStatus,onReady,onViewers,onMessage};},[onStatus,onReady,onViewers,onMessage]);const startup=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const ref=useRef<WebView>(null),loaded=useRef(false),latest=useRef(messages);useEffect(()=>{latest.current=messages;},[messages]);
 useEffect(()=>{const r=new RecoveryScheduler(()=>setRevision(n=>n+1));recovery.current=r;const sub=AppState.addEventListener('change',state=>{if(state!=='active')return;clearTimeout(probe.current);if(!loaded.current){r.resume();return;}probe.current=setTimeout(()=>r.resume(),2500);ref.current?.injectJavaScript('window.resume && window.resume();true;');if(latest.current)ref.current?.injectJavaScript(`${JSON.stringify(latest.current)}.forEach(window.publish);true;`);});return()=>{r.stop();clearTimeout(probe.current);sub.remove();// App state cleanup never disconnects a healthy peer. Explicit trip revocation unmounts the WebView.
};},[role,pin,viewerId]);
 // Read the latest recovered WebView only on explicit transport unmount, before native removal.
 useLayoutEffect(()=>()=>{ref.current?.injectJavaScript('window.stopSharing && window.stopSharing();true;');},[]);
 const html=useMemo(()=>nativePeerHtml(role,pin,viewerId),[role,pin,viewerId]);const source=useMemo(()=>({html,baseUrl:SHARE_ORIGIN}),[html]);
 useEffect(()=>{loaded.current=false;startup.current=setTimeout(()=>{callbacks.current.onStatus('Connection timed out. Retry when both devices are online.');recovery.current?.request();},20000);return()=>clearTimeout(startup.current);},[role,pin,viewerId,revision]);
 const failed=()=>{clearTimeout(startup.current);loaded.current=false;callbacks.current.onStatus('Sharing unavailable on this device.');recovery.current?.request();};
 const publish=useCallback((m:typeof messages)=>{if(m)ref.current?.injectJavaScript(`${JSON.stringify(m)}.forEach(window.publish);true;`);},[]);
 useEffect(()=>{if(loaded.current)publish(messages);},[messages,publish]);
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',width:1,height:1,opacity:0}}><WebView key={`${pin}-${revision}`} ref={ref} source={source} originWhitelist={['https://*','http://localhost*','http://127.0.0.1*']} onShouldStartLoadWithRequest={r=>r.url==='about:blank'||r.url===`${SHARE_ORIGIN}/`} javaScriptEnabled onMessage={e=>{try{const m=JSON.parse(e.nativeEvent.data);if(m.type==='recover')recovery.current?.request();if(m.type==='resumed')clearTimeout(probe.current);if(m.type==='loaded'){loaded.current=true;publish(latest.current);}if(m.type==='viewers' && Number.isInteger(m.value) && m.value>=0 && m.value<=256)callbacks.current.onViewers?.(m.value);if(m.type==='ready'){if(role==='host')recovery.current?.ready();clearTimeout(startup.current);callbacks.current.onReady?.();}if(m.type==='status'&&typeof m.value==='string'){if(/unavailable|timed out/.test(m.value))clearTimeout(startup.current);callbacks.current.onStatus(m.value);}if(m.type==='message'){const v=parseTripMessage(m.value);if(v){if(v.type==='progress')recovery.current?.ready();callbacks.current.onMessage?.(v);}}}catch{}}} onError={failed} onContentProcessDidTerminate={failed} onRenderProcessGone={failed} /></View>;
}
