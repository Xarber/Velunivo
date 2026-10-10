import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { inspectActivityInstallation } from './activityInstallation';
import { ActivityReport, activityDiagnosis } from '../core/activityDiagnostics';
import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, LiveActivity, LiveActivityEnvironment } from 'expo-widgets';
import { NavigationActivity, rideActivity } from '../core/liveActivity';
import { Route, Profile, NavigationOptions, Fix } from '../core/types';
import { guidance } from '../core/navigation';
let lastActivityError = '';
export function inspectLiveActivity():ActivityReport { const checks=inspectActivityInstallation();let activeCount:number|null=null;try{activeCount=activity.getInstances().length+testActivity.getInstances().length;}catch{}return {checks,activeCount,lastError:lastActivityError}; }
const NavigationLayout = (p: NavigationActivity, environment: LiveActivityEnvironment) => {
  'widget';
  const accent=environment.isLuminanceReduced ? '#FFFFFF' : '#28DAB0';
  return {
    banner: <VStack modifiers={[padding({all:12})]}><Text modifiers={[font({weight:'bold',size:20}),foregroundStyle(accent)]}>{p.distance} · {p.turn}</Text><Text>{p.arrival} arrival · {p.minutes} · {p.remaining}</Text></VStack>,
    compactLeading: <Image systemName={p.symbol} color={accent} />,
    compactTrailing: <Text>{p.distance}</Text>,
    minimal: <Image systemName={p.symbol} color={accent} />,
    expandedLeading: <Image systemName={p.symbol} color={accent} />,
    expandedTrailing: <Text modifiers={[font({size:20,weight:'bold'})]}>{p.distance}</Text>,
    expandedBottom: <VStack modifiers={[padding({all:8})]}><Text>{p.turn}</Text><Text>{p.arrival} arrival · {p.minutes} · {p.remaining}</Text></VStack>,
  };
};
const activity=createLiveActivity<NavigationActivity>('VelunivoNavigation',NavigationLayout);
// Separate factory: tests must never replace, update or end a real ride.
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

export function useNavigationActivity(active: boolean, props: NavigationActivity) {
  const instance=useRef<LiveActivity<NavigationActivity> | null>(null), latest=useRef(props), last=useRef('');
  const [status,setStatus]=useState(''); useEffect(()=>{latest.current=props;},[props]);
  useEffect(()=>{ try { for(const old of activity.getInstances()) void old.end('immediate').catch(()=>{}); } catch { /* Unsupported/sideloaded host. */ } },[]);
  useEffect(()=>{ if(!active)return;
    // The native ActivityKit factory synchronously reports availability.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { instance.current=activity.start(latest.current,'velunivo:///',new Date(Date.now()+30000)); lastActivityError=''; const report=inspectLiveActivity();setStatus(report.checks && Object.values(report.checks).some(value=>!value) ? activityDiagnosis(report) : 'Live Activity requested · check the Lock Screen'); } catch (error) { lastActivityError=error instanceof Error ? error.message : String(error);setStatus(`Live Activity could not start: ${lastActivityError}. Check iOS Settings → Apps → Velunivo → Live Activities.`); }
    return ()=>{const live=instance.current;instance.current=null;last.current='';if(live)void live.end('immediate').catch(()=>{});};
  },[active]);
  useEffect(()=>{ if(!active || !instance.current || AppState.currentState !== 'active')return; const key=JSON.stringify(props);if(key===last.current)return;last.current=key;void instance.current.update(props,new Date(Date.now()+30000)).catch(error=>{lastActivityError=error instanceof Error ? error.message : String(error);setStatus(`Live Activity could not update: ${lastActivityError}`);}); },[active,props]);
  return {status};
}

// Called directly by GPS task delivery; does not depend on a background React render.
export async function updateRideActivity(route:Route,profile:Profile,options:NavigationOptions,g:ReturnType<typeof guidance>,fix:Fix,simulation=false) {
 try { for(const live of activity.getInstances()) {
   if(g.arrived || !options.liveActivities)await live.end('immediate');
   else await live.update(rideActivity(route,profile,options,g,fix,simulation),new Date(Date.now()+30000));
 } } catch (error) { lastActivityError=error instanceof Error ? error.message : String(error); }
}
export async function markActivityPaused() {try {for(const live of activity.getInstances())await live.update({turn:'Guidance paused · enable background location',symbol:'arrow.up',distance:'—',arrival:'—',minutes:'—',remaining:'—'},new Date());} catch { /* Unsupported extension. */ }}
