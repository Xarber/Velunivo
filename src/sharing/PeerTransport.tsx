import React,{useEffect,useMemo,useRef,useCallback} from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';
import {nativePeerHtml} from './nativePeerHtml';
import {parseTripMessage,SHARE_ORIGIN} from './model';
import {TransportProps} from './transportTypes';
// Native WebRTC data channels run in WKWebView/Android WebView, with no media permissions.
export default function PeerTransport({role,pin,messages,onMessage,onStatus,onReady,onViewers}:TransportProps){
 const callbacks=useRef({onStatus,onReady,onViewers,onMessage});useEffect(()=>{callbacks.current={onStatus,onReady,onViewers,onMessage};},[onStatus,onReady,onViewers,onMessage]);const startup=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const ref=useRef<WebView>(null),loaded=useRef(false),latest=useRef(messages);useEffect(()=>{latest.current=messages;},[messages]);
 const html=useMemo(()=>nativePeerHtml(role,pin),[role,pin]);const source=useMemo(()=>({html,baseUrl:SHARE_ORIGIN}),[html]);
 useEffect(()=>{loaded.current=false;startup.current=setTimeout(()=>callbacks.current.onStatus('Connection timed out. Retry when both devices are online.'),20000);return()=>clearTimeout(startup.current);},[role,pin]);
 const failed=()=>{clearTimeout(startup.current);loaded.current=false;callbacks.current.onStatus('Sharing unavailable on this device.');};
 const publish=useCallback((m:typeof messages)=>{if(m)ref.current?.injectJavaScript(`${JSON.stringify(m)}.forEach(window.publish);true;`);},[]);
 useEffect(()=>{if(loaded.current)publish(messages);},[messages,publish]);
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',width:1,height:1,opacity:0}}><WebView ref={ref} source={source} originWhitelist={['https://*','http://localhost*','http://127.0.0.1*']} onShouldStartLoadWithRequest={r=>r.url==='about:blank'||r.url===`${SHARE_ORIGIN}/`} javaScriptEnabled onMessage={e=>{try{const m=JSON.parse(e.nativeEvent.data);if(m.type==='loaded'){loaded.current=true;publish(latest.current);}if(m.type==='viewers' && Number.isInteger(m.value) && m.value>=0 && m.value<=256)callbacks.current.onViewers?.(m.value);if(m.type==='ready'){clearTimeout(startup.current);callbacks.current.onReady?.();}if(m.type==='status'&&typeof m.value==='string'){if(/unavailable|timed out/.test(m.value))clearTimeout(startup.current);callbacks.current.onStatus(m.value);}if(m.type==='message'){const v=parseTripMessage(m.value);if(v)callbacks.current.onMessage?.(v);}}catch{}}} onError={failed} onContentProcessDidTerminate={failed} onRenderProcessGone={failed} /></View>;
}
