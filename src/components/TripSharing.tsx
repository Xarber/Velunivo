import {t} from '../i18n/core';
import Text from './LocalizedText';
import {Ionicons} from '@expo/vector-icons';
import React,{useEffect,useMemo,useState,useRef} from 'react';
import {Modal, View} from 'react-native';
import * as Crypto from 'expo-crypto';
import {Button,usePalette,styles} from './ui';
import PeerTransport from '../sharing/PeerTransport';
import {pinFromBytes,sharedRoute,sharedProgress,SHARE_ORIGIN,TripMessage} from '../sharing/model';
import {shareLink} from '../sharing/shareLink';
import {Coord,Route} from '../core/types';
export default function TripSharing({active,children,route,position,seconds,meters,now}:{active:boolean;children(controls:React.ReactNode):React.ReactNode;route:Route|null;position?:Coord;seconds:number;meters:number;now:number}){
 const p=usePalette(),[confirm,setConfirm]=useState(false),[pin,setPin]=useState<string|null>(null),[status,setStatus]=useState(''),[ready,setReady]=useState(false),[starting,setStarting]=useState(false),[viewers,setViewers]=useState(0);
 const coordinates=route?.coordinates;
 const initial=useMemo<TripMessage|undefined>(()=>route?{type:'route',route:sharedRoute(route)}:undefined,[route]);
 const request=useRef(0),live=useRef(active);
 useEffect(()=>{live.current=active;if(!active)request.current++;},[active]);
 const update=useMemo<TripMessage>(()=>({type:'progress',progress:sharedProgress(position||null,seconds,meters,now)}),[position,seconds,meters,now]); // The transport broadcasts progress at most once per five seconds.
 const messages=useMemo(()=>initial?[initial,update]:[update],[initial,update]);
 // Reset consent and revoke the peer session when navigation ends.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{if(!active){setPin(null);setConfirm(false);setReady(false);}},[active]);
 useEffect(()=>{if(!pin)return;const timeout=setTimeout(()=>{setPin(null);setReady(false);setStatus('Sharing expired after 12 hours.');},12*60*60*1000);return()=>clearTimeout(timeout);},[pin]);

 const link=pin?`${SHARE_ORIGIN}/share/trip?pin=${pin}`:'';
 const controls=active&&coordinates?<SharingControls pin={pin} viewers={viewers} status={status} ready={ready} onShare={()=>void shareLink(link,'Follow my Velunivo trip').catch(()=>setStatus('Could not share the link. Try again.'))} onStop={()=>{setPin(null);setReady(false);setStatus('');}} onConfirm={()=>setConfirm(true)} />:null;
 return <>
  {active&&pin&&<PeerTransport role="host" pin={pin} messages={messages} onViewers={setViewers} onStatus={setStatus} onReady={()=>setReady(true)} />}
  <Modal visible={confirm&&active} transparent animationType="fade" onRequestClose={()=>{request.current++;setConfirm(false);}}><View style={{flex:1,justifyContent:'center',backgroundColor:'#0008',padding:24}}><View style={[styles.card,{backgroundColor:p.card,maxWidth:500,width:'100%',alignSelf:'center'}]}><Text style={{color:p.text,fontSize:22,fontWeight:'800'}}>Share your live trip?</Text><Text style={{color:p.muted,lineHeight:22}}>Anyone with the link can see your location, full route, arrival time, time left and distance left until you stop sharing or end your ride. Speed, limits, battery and vehicle telemetry are never sent.</Text><Text style={{color:p.muted,lineHeight:22}}>Connecting uses PeerJS signaling and encrypted peer-to-peer data. Peers may learn your network address. Updates can pause when your phone is locked or the app is suspended.</Text><Button title={t("Confirm trip sharing")} icon="people-outline" disabled={starting} onPress={()=>{setStarting(true);const token=++request.current;void Crypto.getRandomBytesAsync(20).then(bytes=>{if(!live.current||token!==request.current)return;setPin(pinFromBytes(bytes));setReady(false);setStatus('Connecting…');setConfirm(false);}).catch(()=>setStatus('Could not create a secure sharing code.')).finally(()=>setStarting(false));}} /><Button title={t("Cancel")} icon="close" secondary onPress={()=>{request.current++;setConfirm(false);}} /></View></View></Modal>
 {children(controls)}
 </>;
}

function SharingControls({pin,viewers,status,ready,onShare,onStop,onConfirm}:{pin:string|null;viewers:number;status:string;ready:boolean;onShare():void;onStop():void;onConfirm():void}){const p=usePalette();return <View style={{gap:10}}>{pin?<><View accessibilityLabel={t(`${viewers} ${viewers===1?'viewer':'viewers'} watching this trip`)} style={{flexDirection:'row',alignItems:'center',gap:6}}><Ionicons name="person-outline" size={18} color={p.accent} /><Text style={{color:p.text}}>{viewers} watching</Text></View><Text accessibilityRole="alert" style={{color:p.muted}}>{status}</Text><Button title={t("Share trip link")} icon="share-outline" disabled={!ready} secondary onPress={onShare} /><Button title={t("Stop sharing trip")} icon="close-circle-outline" secondary onPress={onStop} /></>:<Button title={t("Share trip")} icon="people-outline" secondary onPress={onConfirm} />}</View>;}
