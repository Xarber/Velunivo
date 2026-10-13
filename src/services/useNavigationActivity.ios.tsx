import {t} from '../i18n/core';
import {currentActivityExtras} from './activityExtras';
import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { inspectActivityInstallation } from './activityInstallation';
import { ActivityReport, activityDiagnosis } from '../core/activityDiagnostics';
import { Image, Text, VStack, HStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, LiveActivity, LiveActivityEnvironment } from 'expo-widgets';
import { NavigationActivity, rideActivity } from '../core/liveActivity';
import { Route, Profile, NavigationOptions, Fix } from '../core/types';
import { guidance } from '../core/navigation';
let lastActivityError = '';
let currentRideProps:NavigationActivity|undefined;
export function inspectLiveActivity():ActivityReport { const checks=inspectActivityInstallation();let activeCount:number|null=null;try{activeCount=activity.getInstances().length+testActivity.getInstances().length+spectatorActivity.getInstances().length+recordingActivity.getInstances().length;}catch{}return {checks,activeCount,lastError:lastActivityError}; }
const NavigationLayout = (p: NavigationActivity, environment: LiveActivityEnvironment) => {
  'widget';
  const accent=environment.isLuminanceReduced ? '#FFFFFF' : '#28DAB0';
  const old=environment.isStale || p.batteryOld;
  const batteryTint=old?'#E49235':p.batteryColor || accent;
  const badges=<HStack spacing={16}>{p.batteryPercent!==undefined && <HStack spacing={5}><Image systemName={p.batterySymbol || 'battery.100percent'} color={batteryTint} /><Text modifiers={[foregroundStyle(batteryTint)]}>{p.batteryPercent}%</Text>{old && <Text modifiers={[foregroundStyle(batteryTint)]}>{p.oldLabel}</Text>}{p.batteryUpdatedAt!==undefined && <Text date={new Date(p.batteryUpdatedAt)} dateStyle="relative" modifiers={[font({size:11}),foregroundStyle(batteryTint)]} />}</HStack>}{p.viewerCount!==undefined && <HStack spacing={5}><Image systemName="eye.fill" color={accent} /><Text>{p.viewerCount}</Text>{environment.isStale && <Image systemName="clock" color="#E49235" />}</HStack>}{p.groupCount!==undefined&&<HStack spacing={5}><Image systemName="person.2.fill" color={accent}/><Text>{p.groupCount}</Text></HStack>}</HStack>;
  return {
    banner: <VStack modifiers={[padding({all:16})]}><Text modifiers={[font({weight:'bold',size:20}),foregroundStyle(accent)]}>{p.distance} · {p.turn}</Text><Text>{p.arrival}{p.recording?'':` ${p.arrivalLabel||'Arrival'}`} · {p.minutes} · {p.remaining}</Text>{environment.isStale&&<Text modifiers={[foregroundStyle('#E49235')]}>{p.oldLabel}</Text>}{badges}</VStack>,
    compactLeading: <Image systemName={p.symbol} color={accent} />,
    compactTrailing: <Text>{p.recording?p.timer:p.distance}</Text>,
    minimal: <Image systemName={p.symbol} color={accent} />,
    expandedLeading: <VStack alignment="leading" spacing={6}><Image systemName={p.symbol} color={accent} modifiers={[font({size:36,weight:'semibold'})]} />{!p.recording&&<Text modifiers={[font({size:16,weight:'semibold'}),foregroundStyle(accent)]}>{p.distance}</Text>}</VStack>,
    expandedTrailing: <HStack>{p.recording?<Text modifiers={[font({size:22,weight:'semibold'})]}>{p.timer}</Text>:null}</HStack>,
    expandedBottom: <VStack modifiers={[padding({all:12})]}><Text>{p.turn}</Text><Text>{p.arrival}{p.recording?'':` ${p.arrivalLabel||'Arrival'}`} · {p.minutes} · {p.remaining}</Text>{environment.isStale&&<Text modifiers={[foregroundStyle('#E49235')]}>{p.oldLabel}</Text>}{badges}</VStack>,
  };
};
const activity=createLiveActivity<NavigationActivity>('VelunivoNavigation',NavigationLayout);
// Separate factory: tests must never replace, update or end a real ride.
const recordingActivity=createLiveActivity<NavigationActivity>('VelunivoRecording',NavigationLayout);
const spectatorActivity=createLiveActivity<NavigationActivity>('VelunivoSharedTrip',NavigationLayout);
const testActivity=createLiveActivity<NavigationActivity>('VelunivoNavigationTest',NavigationLayout);
let testTimer:ReturnType<typeof setTimeout>|undefined;
export async function stopTestLiveActivity() {
  if(testTimer)clearTimeout(testTimer);
  testTimer=undefined;
  for(const live of testActivity.getInstances())await live.end('immediate');
}
export async function startTestLiveActivity() {
  if(AppState.currentState!=='active')throw new Error('Open the app to start the Live Activity test.');
  try {
    await stopTestLiveActivity();
    testActivity.start({turn:'Live Activity test · Turn right',symbol:'arrow.turn.up.right',distance:'100 m',arrival:new Date(Date.now()+600000).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}),minutes:'10 min',remaining:'2.5 km'},'velunivo:///',new Date(Date.now()+90000));
    lastActivityError='';
    // Best-effort cleanup while JS runs. staleDate alone does not end an activity.
    testTimer=setTimeout(()=>{void stopTestLiveActivity().catch(error=>{lastActivityError=error instanceof Error ? error.message : String(error);});},90000);
    return inspectLiveActivity();
  } catch(error) {lastActivityError=error instanceof Error ? error.message : String(error);throw error;}
}

export function useNavigationActivity(active:boolean,props:NavigationActivity){return useActivity(activity,active,props,'velunivo:///');}
export function useRecordingActivity(active:boolean,props:NavigationActivity){return useActivity(recordingActivity,active,props,'velunivo:///offline/record-trip');}
export function useSpectatorActivity(active:boolean,props:NavigationActivity,link:string){return useActivity(spectatorActivity,active,props,link);}
function useActivity(factory:typeof activity,active: boolean, props: NavigationActivity,link:string) {
  const instance=useRef<LiveActivity<NavigationActivity> | null>(null), latest=useRef(props), last=useRef('');
  const [status,setStatus]=useState(''); useEffect(()=>{latest.current={...props,oldLabel:props.oldLabel||t('Old'),arrivalLabel:t('Arrival'),pausedLabel:t('Updates paused · last location may be outdated')};if(factory===activity)currentRideProps=active?props:undefined;},[active,props,factory]);
  useEffect(()=>{ try { for(const old of factory.getInstances()) void old.end('immediate').catch(()=>{}); } catch { /* Unsupported/sideloaded host. */ } },[factory]);
  useEffect(()=>{ if(!active)return;
    // The native ActivityKit factory synchronously reports availability.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { instance.current=factory.start(latest.current,link,new Date(Date.now()+30000)); lastActivityError=''; const report=inspectLiveActivity();setStatus(report.checks && Object.values(report.checks).some(value=>!value) ? activityDiagnosis(report) : 'Live Activity requested · check the Lock Screen'); } catch (error) { lastActivityError=error instanceof Error ? error.message : String(error);setStatus(`Live Activity could not start: ${lastActivityError}. Check iOS Settings → Apps → Velunivo → Live Activities.`); }
    return ()=>{const live=instance.current;instance.current=null;last.current='';if(live)void live.end('immediate').catch(()=>{});};
  },[active,factory,link]);
  useEffect(()=>{ if(!active || !instance.current)return; const key=JSON.stringify(props);if(key===last.current)return;last.current=key;void instance.current.update({...props,oldLabel:props.oldLabel||t('Old'),arrivalLabel:t('Arrival'),pausedLabel:t('Updates paused · last location may be outdated')},new Date(Date.now()+30000)).catch(error=>{lastActivityError=error instanceof Error ? error.message : String(error);setStatus(`Live Activity could not update: ${lastActivityError}`);}); },[active,props,factory]);
  return {status};
}

// Called directly by GPS task delivery; does not depend on a background React render.
export async function updateRideActivity(route:Route,profile:Profile & {id?:string},options:NavigationOptions,g:ReturnType<typeof guidance>,fix:Fix,simulation=false) {
 try { for(const live of activity.getInstances()) {
   if(g.arrived || !options.liveActivities)await live.end('immediate');
   else {currentRideProps={...rideActivity(route,profile,options,g,fix,simulation),...currentActivityExtras(profile.id ?? '')};await live.update(currentRideProps,new Date(Date.now()+30000));}
 } } catch (error) { lastActivityError=error instanceof Error ? error.message : String(error); }
}
export async function markActivityPaused() {try {for(const live of activity.getInstances())await live.update({...currentRideProps,batteryOld:true,turn:'Guidance paused · enable background location',symbol:'arrow.up',distance:'—',arrival:'—',minutes:'—',remaining:'—'},new Date());} catch { /* Unsupported extension. */ }}

export async function updateRecordingActivity(props:NavigationActivity){try{for(const live of recordingActivity.getInstances())await live.update(props,new Date(Date.now()+30000));}catch(error){lastActivityError=error instanceof Error?error.message:String(error);}}
