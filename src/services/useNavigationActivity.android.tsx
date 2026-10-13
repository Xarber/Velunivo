import {activityTestData,ActivityTestKind} from '../core/activityTestData';
import {currentActivityExtras} from './activityExtras';
import {useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {requireOptionalNativeModule} from 'expo';
import {NavigationActivity,rideActivity} from '../core/liveActivity';
import {ActivityReport} from '../core/activityDiagnostics';
import {AndroidActivityId,AndroidLiveContent,androidLiveContent} from '../core/androidLiveUpdate';
import {t} from '../i18n/core';
interface NativeUpdates {capabilities():{promotionSupported:boolean;promotionAllowed:boolean|null;notificationsAllowed:boolean};requestPermissionsAsync():Promise<{granted:boolean}>;start(id:string):Promise<void>;update(id:string,content:AndroidLiveContent):Promise<boolean>;end(id:string):Promise<void>;}
const native=requireOptionalNativeModule<NativeUpdates>('VelunivoLiveUpdates');
const queues=new Map<string,Promise<unknown>>();
function enqueue<T>(id:string,task:()=>Promise<T>){const next=(queues.get(id)||Promise.resolve()).catch(()=>{}).then(task);queues.set(id,next.catch(()=>{}));return next;}
async function begin(id:AndroidActivityId){if(!native)throw new Error('Android Live Updates require the latest native build.');if(!native.capabilities().notificationsAllowed&&!(await native.requestPermissionsAsync()).granted)throw new Error('Allow notifications to see your ride on the Lock Screen.');await native.start(id);}
async function publish(id:AndroidActivityId,p:NavigationActivity,url:string){if(!native)throw new Error('Android Live Updates require the latest native build.');return enqueue(id,()=>native.update(id,androidLiveContent(id,p,url,t('Updates paused · last location may be outdated'),t('viewers'))));}
function useActivity(id:AndroidActivityId,active:boolean,props:NavigationActivity,url:string){const [status,setStatus]=useState(''),latest=useRef(props),updateRef=useRef<(()=>void)|undefined>(undefined),payload=useRef('');useEffect(()=>{latest.current=props;},[props]);useEffect(()=>{if(!active)return;let stopped=false,ready=false;const update=()=>{if(stopped||!ready)return;const p=latest.current;payload.current=JSON.stringify(p);void publish(id,p,url).then(()=>{if(!stopped)setStatus('');}).catch(e=>{if(!stopped)setStatus(e.message);});};updateRef.current=update;void enqueue(id,()=>begin(id)).then(()=>{ready=true;update();}).catch(e=>{if(!stopped)setStatus(e.message);});const sub=AppState.addEventListener('change',state=>{if(state==='active')update();});return()=>{stopped=true;updateRef.current=undefined;sub.remove();void enqueue(id,async()=>{await native?.end(id);}).catch(()=>{});};},[id,active,url]);useEffect(()=>{if(active&&JSON.stringify(props)!==payload.current)updateRef.current?.();},[active,props]);return {status};}
export function useNavigationActivity(active:boolean,props:NavigationActivity){return useActivity('velunivo-navigation',active,props,'velunivo:///');}
export function useRecordingActivity(active:boolean,props:NavigationActivity){return useActivity('velunivo-recording',active,props,'velunivo:///offline/record-trip');}
export function useSpectatorActivity(active:boolean,props:NavigationActivity,url:string){return useActivity('velunivo-spectator',active,props,url);}
export async function updateRideActivity(...args:Parameters<typeof rideActivity>){const profile=args[1] as typeof args[1]&{id?:string};await publish('velunivo-navigation',{...rideActivity(...args),...currentActivityExtras(profile.id??'')},'velunivo:///').catch(()=>{});}
export async function markActivityPaused(){await enqueue('velunivo-navigation',async()=>{await native?.end('velunivo-navigation');});}
export function inspectLiveActivity():ActivityReport{const capabilities=native?.capabilities();return {checks:null,activeCount:null,lastError:!capabilities?'Android Live Updates require the latest native build.':!capabilities.notificationsAllowed?'Allow notifications to see your ride on the Lock Screen.':capabilities.promotionSupported&&capabilities.promotionAllowed?'Android Live Update promotion is allowed. Device appearance still needs checking.':'Android Live Updates are unavailable or disabled. Standard ride notifications are used.'};}
export async function stopTestLiveActivity(){await enqueue('velunivo-test',async()=>{await native?.end('velunivo-test');});}
export async function startTestLiveActivity(kind:ActivityTestKind='navigation',overrides:Partial<NavigationActivity>={}){await enqueue('velunivo-test',()=>begin('velunivo-test'));await publish('velunivo-test',activityTestData(kind,overrides),'velunivo:///');return inspectLiveActivity();}

export async function updateRecordingActivity(props:NavigationActivity){await publish('velunivo-recording',props,'velunivo:///offline/record-trip').catch(()=>{});}
