import {useSpectatorActivity} from '../../services/useNavigationActivity';
import {PUBLIC_SERVER_WARNING} from '../../sharing/serverSelection';
import * as Crypto from 'expo-crypto';
import {clientPeerId} from '../../sharing/peerIdentity';
import {t} from '../../i18n/core';
import Text from '../../components/LocalizedText';
import React,{useState,useEffect,useMemo} from 'react';
import {View, Platform, Linking, useWindowDimensions} from 'react-native';
import {useLocalSearchParams,router,usePathname} from 'expo-router';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import RideMap from '../../components/RideMap';
import GlassSurface from '../../components/GlassSurface';
import {Button,usePalette,PaletteProvider} from '../../components/ui';
import PeerTransport from '../../sharing/PeerTransport';
import {PIN_PATTERN,SharedRoute,SharedProgress,previewRoute,TripMessage} from '../../sharing/model';
import {minutes} from '../../core/eta';
import {distanceLeft} from '../../core/rideView';
import {useStore} from '../../services/store';
export default function SharedTrip(){
 const {pin,cloud}=useLocalSearchParams<{pin:string;cloud?:string}>(),system=usePalette(),insets=useSafeAreaInsets(),{width}=useWindowDimensions(),{navigationOptions}=useStore();
 const p={...system,dark:true,text:'#F6FAFC',muted:'#ADBCC6',line:'#30434B',accent:'#64DCC5'};
 const valid=typeof pin==='string'&&PIN_PATTERN.test(pin),[connected,setConnected]=useState(false),[retry,setRetry]=useState(0),[status,setStatus]=useState(''),[route,setRoute]=useState<SharedRoute|null>(null),[progress,setProgress]=useState<SharedProgress|null>(null),[ended,setEnded]=useState(false),[now,setNow]=useState(()=>Date.now());
 const viewing=usePathname()==='/share/trip';
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
 // Scoped to this viewing session, retained across transport retries; never a device identifier.
 const viewerId=useMemo(()=>typeof pin==='string' && PIN_PATTERN.test(pin)?clientPeerId('viewer',Crypto.getRandomBytes(16)):undefined,[pin]);
 const [publicServer,setPublicServer]=useState(cloud==='1');
 const wide=width>=700,[panelHeight,setPanelHeight]=useState(340);
 const padding=useMemo(()=>wide?{top:110,bottom:45,left:450,right:45}:{top:insets.top+115,bottom:insets.bottom+panelHeight+30,left:28,right:28},[wide,panelHeight,insets.top,insets.bottom]);
 const preview=useMemo(()=>route?previewRoute(route):null,[route]);
 const routes=useMemo(()=>preview?[preview]:[],[preview]);
 function receive(m:TripMessage){if(m.type==='route')setRoute(m.route);if(m.type==='progress'){setProgress(m.progress);setStatus('Receiving live trip updates');}if(m.type==='ended'){setEnded(true);setConnected(false);setStatus('Trip sharing ended');}}
 const stale=!progress||now-progress.updatedAt>20000||progress.updatedAt>now+30000;
 const usable=progress&&!stale&&!ended;
 const waiting=connected&&!ended&&(!route||!progress||status==='Reconnecting…'||status==='Connecting…'||status==='Connected · waiting for location')&&!/unavailable|timed out|interrupted|disconnected|lost|Retry/.test(status);
 const activityProps=useMemo(()=>({updatedAt:progress?.updatedAt,turn:t(stale?'Updates paused · last location may be outdated':'Viewing shared trip'),symbol:'flag.fill' as const,distance:progress?distanceLeft(progress.metersLeft,navigationOptions.unit):'—',arrival:progress?new Date(progress.arrivalAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—',minutes:progress?minutes(progress.secondsLeft):'—',remaining:progress?distanceLeft(progress.metersLeft,navigationOptions.unit):'—'}),[stale,progress,navigationOptions.unit]);
 const spectatorActivity=useSpectatorActivity(connected&&viewing&&!ended&&!!progress&&navigationOptions.liveActivities,activityProps,`velunivo://share/trip?pin=${pin}${cloud==='1'?'&cloud=1':''}`);

 return <PaletteProvider value={p}><SafeAreaView edges={[]} style={{flex:1,backgroundColor:p.bg}}>
  {connected&&viewing&&valid&&<PeerTransport key={`${pin}-${retry}`} role="viewer" pin={pin} viewerId={viewerId} forcePublic={cloud==='1'} onServer={setPublicServer} onMessage={receive} onStatus={setStatus} />}
  <View style={{flex:1}}><RideMap scratchContext="home" key={wide?'wide-preview':'compact-preview'} routes={routes} selected={preview} positionLabel="Rider location" position={progress?.position||undefined} follow={false} overview tilted={false} fitPadding={padding} /></View>
  <GlassSurface expanded style={{position:'absolute',top:insets.top+12,left:16,right:wide?undefined:16,width:wide?390:undefined,padding:16,borderRadius:22}}><Text style={{color:p.text,fontWeight:'800',fontSize:22}}>Live trip · full route</Text><Text style={{color:p.muted}}>{route?`${route.startLabel} → ${route.endLabel}`:'No location is requested from your device.'}</Text></GlassSurface>
  <GlassSurface expanded onLayout={e=>setPanelHeight(e.nativeEvent.layout.height)} style={{position:'absolute',bottom:insets.bottom+12,left:16,right:wide?undefined:16,width:wide?390:undefined,padding:18,borderRadius:24,gap:12}}>
   {!valid?<Text style={{color:p.text}}>Invalid sharing code.</Text>:!connected&&!ended?<><Text style={{color:p.muted}}>View the rider’s location, route and arrival estimate. Connect only if you trust this link. PeerJS signaling is used; peers may learn your network address.</Text><Button title={t("View shared trip")} icon="people-outline" onPress={()=>{setConnected(true);setStatus('Connecting…');}} /></>:<><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text accessibilityRole="alert" style={{color:p.text,flex:1}}>{ended?'Trip sharing ended':status}</Text></View>{progress&&<><Text style={{color:p.text,fontSize:24,fontWeight:'800'}}>{usable?new Date(progress.arrivalAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'} <Text style={{fontSize:14}}>arrival</Text></Text><Text style={{color:p.text}}>{usable?`${minutes(progress.secondsLeft)} · ${distanceLeft(progress.metersLeft,navigationOptions.unit)} left`:'Updates paused · last location may be outdated'}</Text><Text style={{color:p.muted,fontSize:12}}>Last update {new Date(progress.updatedAt).toLocaleTimeString()}</Text></>}{!ended&&<Button title={t("Reconnect")} secondary icon="refresh" loading={waiting} onPress={()=>{setRetry(r=>r+1);setStatus('Reconnecting…');}} />}<Button title={t("Close shared trip")} secondary icon="close" onPress={()=>{setConnected(false);router.replace('/');}} /></>}
   {navigationOptions.developerMode&&!!spectatorActivity.status&&<Text style={{color:p.muted,fontSize:12}}>{spectatorActivity.status}</Text>}{publicServer&&<Text style={{color:'#E49235',fontSize:12}}>{PUBLIC_SERVER_WARNING}</Text>}
   {Platform.OS==='web'&&valid&&<Button title={t("Open in Velunivo app")} secondary icon="phone-portrait-outline" onPress={()=>void Linking.openURL(`velunivo://share/trip?pin=${pin}${cloud==='1'?'&cloud=1':''}`)} />}
  </GlassSurface>
 </SafeAreaView></PaletteProvider>;
}
