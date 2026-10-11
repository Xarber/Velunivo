import React,{useEffect,useMemo,useRef} from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';
import {SHARE_ORIGIN} from './model';
import {dataSyncHtml} from './dataSyncHtml';
import type {SyncPacket} from '../core/dataSync';
import type {SyncChoicePacket} from '../core/dataSyncChoice';
export interface DataSyncTransportProps {role:'sender'|'receiver';code:string;onOpen(send:(p:SyncPacket|SyncChoicePacket)=>void):void;onData(data:unknown):void;onError():void;}
export default function DataSyncTransport(props:DataSyncTransportProps){const ref=useRef<WebView>(null),latest=useRef(props);useEffect(()=>{latest.current=props;},[props]);const html=useMemo(()=>dataSyncHtml(props.role,props.code),[props.role,props.code]);return <View pointerEvents="none" accessibilityElementsHidden style={{position:'absolute',width:1,height:1,opacity:0}}><WebView ref={ref} source={{html,baseUrl:SHARE_ORIGIN}} originWhitelist={['https://*','http://localhost*','http://127.0.0.1*']} onShouldStartLoadWithRequest={r=>r.url==='about:blank'||r.url===`${SHARE_ORIGIN}/`} onMessage={event=>{try{const msg=JSON.parse(event.nativeEvent.data);if(msg.type==='open')latest.current.onOpen(packet=>ref.current?.injectJavaScript(`window.sendPacket(${JSON.stringify(packet)});true;`));if(msg.type==='data')latest.current.onData(msg.value);if(msg.type==='error')latest.current.onError();}catch{latest.current.onError();}}} onError={()=>latest.current.onError()}/></View>}
