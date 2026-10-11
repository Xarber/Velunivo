import React,{useEffect,useMemo,useRef,useCallback} from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';
import {nativePeerHtml} from './nativePeerHtml';
import {parseTripMessage,SHARE_ORIGIN} from './model';
import {TransportProps} from './transportTypes';
// Native WebRTC data channels run in WKWebView/Android WebView, with no media permissions.
export default function PeerTransport({role,pin,messages,onMessage,onStatus,onReady}:TransportProps){
 const ref=useRef<WebView>(null),loaded=useRef(false),latest=useRef(messages);useEffect(()=>{latest.current=messages;},[messages]);
 const html=useMemo(()=>nativePeerHtml(role,pin),[role,pin]);
 const publish=useCallback((m:typeof messages)=>{if(m)ref.current?.injectJavaScript(`${JSON.stringify(m)}.forEach(window.publish);true;`);},[]);
 useEffect(()=>{if(loaded.current)publish(messages);},[messages,publish]);
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',width:1,height:1,opacity:0}}><WebView ref={ref} source={{html,baseUrl:SHARE_ORIGIN}} originWhitelist={['https://*','http://localhost*','http://127.0.0.1*']} onShouldStartLoadWithRequest={r=>r.url==='about:blank'||r.url===`${SHARE_ORIGIN}/`} javaScriptEnabled onMessage={e=>{try{const m=JSON.parse(e.nativeEvent.data);if(m.type==='loaded'){loaded.current=true;publish(latest.current);}if(m.type==='ready')onReady?.();if(m.type==='status'&&typeof m.value==='string')onStatus(m.value);if(m.type==='message'){const v=parseTripMessage(m.value);if(v)onMessage?.(v);}}catch{}}} onError={()=>onStatus('Sharing unavailable on this device.')} /></View>;
}
