import {useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import * as Notifications from 'expo-notifications';
import {NavigationActivity,rideActivity} from '../core/liveActivity';
import {ActivityReport} from '../core/activityDiagnostics';
import {t} from '../i18n/core';
const CHANNEL='velunivo-rides';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:false,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});
let prepared:Promise<boolean>|undefined;
async function ready(){return prepared??=(async()=>{await Notifications.setNotificationChannelAsync(CHANNEL,{name:'Velunivo rides',importance:Notifications.AndroidImportance.LOW,sound:null,lockscreenVisibility:Notifications.AndroidNotificationVisibility.PUBLIC});const permission=await Notifications.getPermissionsAsync();return permission.granted||(await Notifications.requestPermissionsAsync()).granted;})();}
async function end(id:string){await Notifications.cancelScheduledNotificationAsync(id);await Notifications.dismissNotificationAsync(id);}
async function publish(id:string,p:NavigationActivity,url:string){if(!await ready())throw new Error('Allow notifications to see your ride on the Lock Screen.');await Notifications.cancelScheduledNotificationAsync(id);const body=`${p.turn} · ${p.distance}\n${p.arrival} · ${p.minutes} · ${p.remaining}${p.batteryPercent!==undefined?` · ${p.batteryPercent}%`:''}${p.viewerCount!==undefined?` · ${p.viewerCount} ${t('viewers')}`:''}`;
 await Notifications.scheduleNotificationAsync({identifier:id,content:{title:'Velunivo',body,data:{url},sticky:true,autoDismiss:false,sound:false},trigger:{channelId:CHANNEL}});
 await Notifications.scheduleNotificationAsync({identifier:id,content:{title:'Velunivo',body:`${t('Updates paused · last location may be outdated')}\n${body}`,data:{url},sticky:true,autoDismiss:false,sound:false},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(Date.now()+30000),channelId:CHANNEL}});
}
function useActivity(id:string,active:boolean,props:NavigationActivity,url:string){const [status,setStatus]=useState(''),latest=useRef(props),last=useRef(0);useEffect(()=>{latest.current=props;},[props]);useEffect(()=>{if(!active)return;let mounted=true;const update=()=>{last.current=Date.now();void publish(id,latest.current,url).then(()=>{if(mounted)setStatus('');}).catch(e=>{if(mounted)setStatus(e.message);});};update();const timer=setInterval(update,10000),sub=AppState.addEventListener('change',s=>{if(s==='active')update();});return()=>{mounted=false;clearInterval(timer);sub.remove();void end(id).catch(()=>{});};},[id,active,url]);useEffect(()=>{if(active&&Date.now()-last.current>=5000){last.current=Date.now();void publish(id,props,url).catch(e=>setStatus(e.message));}},[active,id,props,url]);return {status};}
export function useNavigationActivity(active:boolean,props:NavigationActivity){return useActivity('velunivo-navigation',active,props,'velunivo:///');}
export function useSpectatorActivity(active:boolean,props:NavigationActivity,url:string){return useActivity('velunivo-spectator',active,props,url);}
export async function updateRideActivity(...args:Parameters<typeof rideActivity>){await publish('velunivo-navigation',rideActivity(...args),'velunivo:///').catch(()=>{});}
export async function markActivityPaused(){await end('velunivo-navigation');}
export function inspectLiveActivity():ActivityReport{return {checks:null,activeCount:null,lastError:'Android uses an ongoing ride notification.'};}
export async function stopTestLiveActivity(){await end('velunivo-test');}
export async function startTestLiveActivity(){await publish('velunivo-test',{turn:'Live Activity test · Turn right',symbol:'arrow.turn.up.right',distance:'100 m',arrival:'—',minutes:'10 min',remaining:'2.5 km'},'velunivo:///');return inspectLiveActivity();}
