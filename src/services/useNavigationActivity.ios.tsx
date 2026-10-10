import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, LiveActivity, LiveActivityEnvironment } from 'expo-widgets';
import { NavigationActivity } from '../core/liveActivity';
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
    const app=AppState.addEventListener('change',s=>{const live=instance.current;if(live && s!=='active') void live.update({...latest.current,turn:'Guidance paused · open Velunivo'},new Date(Date.now()+1000)).catch(()=>{});});
    return ()=>{app.remove();const live=instance.current;instance.current=null;last.current='';if(live)void live.end('immediate').catch(()=>{});};
  },[active]);
  useEffect(()=>{ if(!active || !instance.current)return; const key=JSON.stringify(props);if(key===last.current)return;last.current=key;void instance.current.update(props,new Date(Date.now()+30000)).catch(()=>setStatus('Live Activity could not update.')); },[active,props]);
  return {status};
}
