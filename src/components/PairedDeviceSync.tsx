import React,{useEffect,useMemo,useRef,useState,useSyncExternalStore,useCallback} from 'react';
import {AppState} from 'react-native';
import * as Crypto from 'expo-crypto';
import {DataSyncExchange} from '../core/dataSyncExchange';
import {decryptPairPacket,encryptPairPacket,pairEndpoint} from '../core/devicePair';
import DataSyncTransport from '../sharing/DataSyncTransport';
import {peerOptions} from '../sharing/peerOptions';
import {subscribeDevicePair,getDevicePairState,loadDevicePair,saveDevicePair,updateDevicePairState,setUnpairActions} from '../services/devicePairState';
import {exportAutomaticSync,importAutomaticSync,automaticDigest} from '../services/automaticSync';
import {isRideLocked} from '../services/rideLock';
export const privatePairOrigin=()=>`${peerOptions.secure?'https':'http'}://${peerOptions.host}:${peerOptions.port}${peerOptions.path}`;
export default function PairedDeviceSync(){const {pair}=useSyncExternalStore(subscribeDevicePair,getDevicePairState,getDevicePairState),[revision,setRevision]=useState(0),latest=useRef(pair),send=useRef<((packet:unknown)=>void)|undefined>(undefined),exchange=useRef<DataSyncExchange|undefined>(undefined),seen=useRef(new Set<string>()),lastSeen=useRef(0),digest=useRef(''),working=useRef(false),lastAttempt=useRef(0);useEffect(()=>{latest.current=pair;},[pair]);
 useEffect(()=>{void loadDevicePair();},[]);
 const secret=pair?.secret,role=pair?.role,origin=pair?.origin;
 const persistent=useMemo(()=>secret&&role?{localId:pairEndpoint({secret,role}),remoteId:pairEndpoint({secret,role},role==='host'?'guest':'host')}:undefined,[secret,role]);
 const emit=useCallback((packet:unknown)=>{const current=latest.current;if(current)send.current?.(encryptPairPacket(current,packet,Crypto.getRandomBytes(12)));},[]);
 const hello=useCallback(async()=>{if(!latest.current||isRideLocked()||working.current)return;try{const data=await exportAutomaticSync();digest.current=automaticDigest(data);emit({type:'paired-hello',accepted:!latest.current.pending,digest:digest.current,now:Date.now()});}catch{updateDevicePairState({status:'Device sync could not read local data.'});}},[emit]);
 function createExchange(){exchange.current=new DataSyncExchange(latest.current?.role==='host',emit,{connected:()=>{},chosen:()=>updateDevicePairState({syncing:true,status:'Synchronizing paired devices…'}),offer:()=>exchange.current?.approve(),status:status=>{if(status==='Data synchronized.'){working.current=false;exchange.current=undefined;updateDevicePairState({syncing:false,status:'Paired devices are up to date.',lastSync:Date.now()});void hello();}else if(/failed|cancelled/i.test(status)){working.current=false;exchange.current=undefined;updateDevicePairState({syncing:false,status:'Sync paused. It will retry when both devices are available.'});}},export:async()=>{const data=await exportAutomaticSync();return{text:JSON.stringify(data),summary:'Paired device collections'};},import:async text=>{if(isRideLocked())throw new Error('Finish your active ride first');await importAutomaticSync(text);},nonce:()=>Array.from(Crypto.getRandomBytes(16),b=>b.toString(16).padStart(2,'0')).join('')});exchange.current.open();}
 async function receive(raw:unknown){const current=latest.current;if(!current)return;const message=decryptPairPacket(current,raw,seen.current) as {type?:string;accepted?:boolean;digest?:string;now?:number}|null;if(!message)return;lastSeen.current=Date.now();if(message.type==='paired-hello'){
  if(message.accepted!==true)return;if(current.pending){latest.current={...current,pending:false};await saveDevicePair(latest.current);void hello();}
  updateDevicePairState({connected:true,status:isRideLocked()?'Connected · sync resumes after your ride.':working.current?'Synchronizing paired devices…':'Connected'});
  if(!isRideLocked()&&!working.current&&current.role==='host'&&typeof message.digest==='string'&&digest.current&&message.digest!==digest.current&&Date.now()-lastAttempt.current>15000){lastAttempt.current=Date.now();working.current=true;createExchange();exchange.current?.choose('merge');}return;
 }
 if(message.type==='unpair-request'){if(!isRideLocked())updateDevicePairState({incomingUnpair:true,status:'Your other device wants to disconnect.'});return;}
 if(message.type==='unpair-accepted'){emit({type:'unpair-final'});return;}
 if(message.type==='unpair-final'){emit({type:'unpair-complete'});await new Promise(resolve=>setTimeout(resolve,200));await saveDevicePair(null);return;}
 if(message.type==='unpair-complete'){await saveDevicePair(null);return;}
 if(current.pending)return;
 if(isRideLocked()){exchange.current?.cancel();return;}
 if(!exchange.current){working.current=true;createExchange();}exchange.current?.receive(message);
 }
 useEffect(()=>{const timer=setInterval(()=>{if(!latest.current||AppState.currentState!=='active')return;if(!send.current||Date.now()-lastSeen.current>60000){updateDevicePairState({connected:false,syncing:false,status:'Waiting for the other device…'});setRevision(v=>v+1);}else void hello();},30000);const sub=AppState.addEventListener('change',state=>{if(state==='active'&&latest.current){if(Date.now()-lastSeen.current>30000)setRevision(v=>v+1);else void hello();}});return()=>{clearInterval(timer);sub.remove();};},[hello]);
 useEffect(()=>{setUnpairActions(()=>{if(getDevicePairState().connected&&!isRideLocked())emit({type:'unpair-request'});},()=>{if(getDevicePairState().connected&&!isRideLocked()){emit({type:'unpair-accepted'});updateDevicePairState({status:'Waiting for disconnect confirmation…'});}});return()=>setUnpairActions(undefined);},[pair?.secret,emit]);
 useEffect(()=>{send.current=undefined;exchange.current?.cancel();exchange.current=undefined;working.current=false;digest.current='';seen.current.clear();lastSeen.current=Date.now();return()=>{send.current=undefined;};},[revision,pair?.secret]);
 useEffect(()=>{if(origin&&origin!==privatePairOrigin())updateDevicePairState({status:'Reconnect to the private server used for pairing.'});},[origin]);
 if(!pair||!persistent||pair.origin!==privatePairOrigin())return null;
 return <DataSyncTransport key={`${pair.secret.slice(0,8)}-${revision}`} persistent={persistent} role={pair.role==='host'?'sender':'receiver'} code="" onServer={publicServer=>{if(publicServer)updateDevicePairState({connected:false,status:'Private server unavailable · automatic sync is paused.'});}} onOpen={sender=>{send.current=sender;void hello();}} onData={raw=>void receive(raw)} onError={()=>{send.current=undefined;working.current=false;updateDevicePairState({connected:false,syncing:false,status:'Waiting for the other device…'});}}/>;
}
