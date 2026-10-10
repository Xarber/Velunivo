import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, LiveActivity, LiveActivityEnvironment } from 'expo-widgets';
import { NavigationActivity, rideActivity } from '../core/liveActivity';
import { Route, Profile, NavigationOptions, Fix } from '../core/types';
import { guidance } from '../core/navigation';
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
export function useNavigationActivity(active: boolean, props: NavigationActivity) {
  const instance=useRef<LiveActivity<NavigationActivity> | null>(null), latest=useRef(props), last=useRef('');
  const [status,setStatus]=useState(''); useEffect(()=>{latest.current=props;},[props]);
  useEffect(()=>{ try { for(const old of activity.getInstances()) void old.end('immediate').catch(()=>{}); } catch { /* Unsupported/sideloaded host. */ } },[]);
  useEffect(()=>{ if(!active)return;
    // The native ActivityKit factory synchronously reports availability.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { instance.current=activity.start(latest.current,'velunivo:///',new Date(Date.now()+30000)); setStatus(''); } catch { setStatus('Live Activity unavailable on this installation.'); }
    return ()=>{const live=instance.current;instance.current=null;last.current='';if(live)void live.end('immediate').catch(()=>{});};
  },[active]);
  useEffect(()=>{ if(!active || !instance.current || AppState.currentState !== 'active')return; const key=JSON.stringify(props);if(key===last.current)return;last.current=key;void instance.current.update(props,new Date(Date.now()+30000)).catch(()=>setStatus('Live Activity could not update.')); },[active,props]);
  return {status};
}

// Called directly by GPS task delivery; does not depend on a background React render.
export async function updateRideActivity(route:Route,profile:Profile,options:NavigationOptions,g:ReturnType<typeof guidance>,fix:Fix) {
 try { for(const live of activity.getInstances()) {
   if(g.arrived || !options.liveActivities)await live.end('immediate');
   else await live.update(rideActivity(route,profile,options,g,fix),new Date(Date.now()+30000));
 } } catch { /* UI hook reports extension availability; GPS must continue. */ }
}
export async function markActivityPaused() {try {for(const live of activity.getInstances())await live.update({turn:'Guidance paused · enable background location',symbol:'arrow.up',distance:'—',arrival:'—',minutes:'—',remaining:'—'},new Date());} catch { /* Unsupported extension. */ }}
