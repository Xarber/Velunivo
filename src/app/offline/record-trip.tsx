import {Ionicons} from '@expo/vector-icons';
import MapControls from '../../components/MapControls';
import GlassSurface from '../../components/GlassSurface';
import SwipeArea from '../../components/SwipeArea';
import React, {useEffect,useMemo,useState,useRef} from 'react';
import {router,useNavigation} from 'expo-router';
import {Text,View,ScrollView,Pressable,useWindowDimensions,Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useKeepAwake} from 'expo-keep-awake';
import NativeTabSafeOverlay, {usesLiquidGlassTabs} from '../../components/NativeTabSafeOverlay';
import RideMap from '../../components/RideMap';
import VehicleSelector from '../../components/VehicleSelector';
import {Button,IconButton,styles,usePalette,PaletteProvider} from '../../components/ui';
import {useStore} from '../../services/store';
import {useTripRoadLimit} from '../../services/useTripRoadLimit';
import {useLocation} from '../../services/useLocation';
import {useTripLocation} from '../../services/useTripLocation';
import {useHeading} from '../../services/useHeading';
import {useMotion} from '../../services/useSensors';
import {useRideRecorder} from '../../services/useRideRecorder';
import {useDownloadedMaps} from '../../services/useDownloadedMaps';
import {bearing,displaySpeed,distanceLeft,freshFix,forwardHeading} from '../../core/rideView';
import {tripDuration,tripAverage} from '../../core/tripDashboard';
import {batteryLabel} from '../../core/vehicles';
function KeepAwake(){useKeepAwake('velunivo-record-trip');return null;}
export default function RecordTrip(){
  const p=usePalette(),insets=useSafeAreaInsets(),{width,height}=useWindowDimensions(),navigation=useNavigation();
  const {profile,navigationOptions:n,lockVehicle,vehicleLocked,updateNavigationOptions}=useStore();
  const [panelOpen,setPanelOpen]=useState(true);
  const [active,setActive]=useState(false),[saving,setSaving]=useState(false),[now,setNow]=useState(Date.now()),[peak,setPeak]=useState(0),[follow,setFollow]=useState(true);
  const leaving=useRef(false),savingRef=useRef(false);
  const [controlsHeight,setControlsHeight]=useState(height),nativeTabs=usesLiquidGlassTabs();
  const bottomObstruction=nativeTabs?Math.max(0,height-controlsHeight):0;
  const metadata=useMemo(()=>({id:`free-trip-${Date.now()}`,name:`Free ride · ${new Date().toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}`,startLabel:'Trip start',endLabel:'Trip finish'}),[]);
  const motion=useMotion(active),compass=useHeading(active),recorder=useRideRecorder(active,true,false,metadata,profile,motion,compass,n.askBatteryUsage);
  const recordFix=recorder.accept;
  const accept=React.useCallback(async (fix:import('../../core/types').Fix)=>{if(fix.speed!==null)setPeak(v=>Math.max(v,fix.speed!*3.6));await recordFix(fix);},[recordFix]);
  const location=useTripLocation(active,n.backgroundNavigation,accept),preview=useLocation(!active);
  const fix=active ? location.fix : preview.fix,valid=freshFix(fix,now),position=fix?.coordinate;
  const roadLimit=useTripRoadLimit(active,fix,now);
  const offlineMap=useDownloadedMaps(n.downloadedMaps,position,null);
  const meters=recorder.record?.meters || 0,startedAt=recorder.record?.startedAt || now,unit=n.unit==='mi'?'mph':'km/h';
  const trail=recorder.record?.trace;
  const trailHeading=useMemo(()=>{const segment=trail?.at(-1);return segment && segment.length>1?bearing(segment[segment.length-2],segment.at(-1)!):null;},[trail]);
  const heading=n.compass && compass.heading!==null && now-compass.timestamp<3000 ? compass.heading : (fix?.heading!==undefined && (fix.speed ?? 0)>=1?forwardHeading(null,undefined,fix).heading:trailHeading ?? 0);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{if(active){lockVehicle(true);return()=>lockVehicle(false);}},[active,lockVehicle]);
  // Returning to another tab leaves the dashboard mounted; going back ends and checkpoints the recording.
  useEffect(()=>navigation.addListener('beforeRemove',event=>{if(active && !leaving.current){event.preventDefault();void finish();}}),[navigation,active]); // eslint-disable-line react-hooks/exhaustive-deps
  async function finish(){if(savingRef.current)return;savingRef.current=true;setSaving(true);const saved=await recorder.finish();savingRef.current=false;setSaving(false);if(saved!==false){leaving.current=true;setActive(false);router.replace('/offline/rides');}}
  const panelP=panelOpen?{...p,dark:true,bg:'#071118',card:'#15222C',text:'#F6FAFC',muted:'#ADBCC6',line:'#30434B',accent:'#64DCC5'}:p;
  const metric=(label:string,value:string)=><View key={label} style={{minWidth:130,flex:1,gap:4}}><Text style={{color:panelP.muted,fontSize:12}}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{color:panelP.text,fontSize:22,fontWeight:'800',fontVariant:['tabular-nums']}}>{value}</Text></View>;
  return <View style={{flex:1,backgroundColor:p.bg}}>{active && <KeepAwake />}<RideMap trace={active?trail:undefined} routes={[]} selected={null} position={position} follow={follow} onPan={()=>setFollow(false)} heading={heading} navigating={active} tilted={n.tilted} offlineMap={offlineMap} transit={n.transit} traffic={n.traffic} followPadding={{top:insets.top+75+Math.max(0,(height-bottomObstruction-245)*.42),bottom:bottomObstruction+170,left:20,right:20}} />
    <NativeTabSafeOverlay onHeight={setControlsHeight}><View style={{position:'absolute',top:insets.top+12,left:16,right:16,flexDirection:'row',justifyContent:'space-between'}}><IconButton label={active?'Finish recording':'Back to Recorded Rides'} icon={active?'stop-circle-outline':'chevron-back'} disabled={saving} onPress={()=>active ? void finish() : router.back()} /></View><MapControls top={insets.top+162} follow={follow} compass={n.compass} tilted={n.tilted} resume={()=>setFollow(true)} toggleCompass={()=>updateNavigationOptions({compass:!n.compass})} toggleTilt={()=>updateNavigationOptions({tilted:!n.tilted})} />
    <View style={{position:'absolute',top:insets.top+78,left:16,gap:8,alignItems:'center'}}><View style={[styles.card,{backgroundColor:p.card,padding:12,alignItems:'center'}]}><Text style={{color:valid && fix?.speed!=null && fix.speed*3.6>Math.min(profile.maxSpeed,profile.ridingLimit,roadLimit ?? Infinity)+1?'#D85847':p.text,fontSize:34,fontWeight:'800'}}>{valid && fix?.speed!=null ? displaySpeed(fix.speed*3.6,n.unit).toFixed(0) : '—'}</Text><Text style={{color:p.muted,fontSize:12}}>{unit}</Text></View><View accessibilityLabel={`Mapped road speed limit ${roadLimit===null ? 'unknown' : displaySpeed(roadLimit,n.unit).toFixed(0)+' '+unit}`} style={{borderRadius:30,width:60,height:60,borderWidth:5,borderColor:'#D85847',backgroundColor:'#fff',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#162C35',fontSize:24,fontWeight:'800'}}>{roadLimit===null?'—':displaySpeed(roadLimit,n.unit).toFixed(0)}</Text></View><Text style={{color:p.muted,backgroundColor:p.card,padding:5,borderRadius:6,fontSize:10}}>{roadLimit===null?'Limit unknown':`Road · ${unit}`}</Text></View>
    <GlassSurface expanded={panelOpen} style={{position:'absolute',bottom:12,left:12,right:width>=800?undefined:12,width:width>=800?390:undefined,height:panelOpen?Math.min(controlsHeight*.6,480):155,borderRadius:28}}><PaletteProvider value={panelP}>
      <SwipeArea onSwipe={setPanelOpen}><View style={{alignItems:'center',paddingTop:8}}><View style={{width:38,height:4,borderRadius:2,backgroundColor:panelP.muted,opacity:.4}} /></View><View style={{paddingHorizontal:16,paddingVertical:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:panelP.text,fontSize:20,fontWeight:'800'}}>{active?'Recording trip':'Record a trip'}</Text><Pressable accessibilityRole="button" accessibilityLabel={panelOpen?'Collapse recording controls':'Expand recording controls'} onPress={()=>setPanelOpen(v=>!v)} style={{padding:8}}><Ionicons name={panelOpen?'chevron-down':'chevron-up'} color={panelP.accent} size={22} /></Pressable></View></SwipeArea>
      {panelOpen?<ScrollView style={{flex:1}} contentContainerStyle={{padding:16,paddingTop:0,gap:14,paddingBottom:28}}>
{!active && <><VehicleSelector /><Text style={{color:panelP.muted,lineHeight:20}}>Ride freely with a live dashboard. GPS and available sensors are saved to Recorded Rides, even if automatic Record Rides is off. Road limits use nearby OpenStreetMap roads; your position is sent to Overpass while recording.</Text><Button title="Start recording" icon="recording-outline" disabled={vehicleLocked || !freshFix(preview.fix)} onPress={()=>{setPeak(0);setActive(true);setPanelOpen(false);}} /></>}{active && <><Text style={{color:panelP.muted}}>{profile.name} · Riding limit {displaySpeed(Math.min(profile.maxSpeed,profile.ridingLimit),n.unit).toFixed(0)} {unit}</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:14}}>{metric('Trip time',tripDuration(startedAt,now))}{metric('Travelled',distanceLeft(meters,n.unit))}{metric('Average speed',`${displaySpeed(tripAverage(meters,startedAt,now),n.unit).toFixed(1)} ${unit}`)}{metric('Top speed',`${displaySpeed(peak,n.unit).toFixed(0)} ${unit}`)}</View><Text style={{color:panelP.muted,fontSize:12}}>{batteryLabel(meters,profile)}</Text><Button title={saving?'Saving…':'Finish & save trip'} icon="stop-circle-outline" disabled={saving} onPress={()=>void finish()} /></>}
      <Text style={{color:panelP.muted,fontSize:12}}>{active?location.status:preview.status}{fix ? ` · GPS ±${Math.round(fix.accuracy)} m` : ''}</Text><Text style={{color:panelP.muted,fontSize:11}}>Mapped road limits can be missing or ambiguous. Follow posted signs. {Platform.OS==='web'?'Keep this page open to record.':''}</Text>{!!(recorder.error || location.error) && <Text style={{color:'#D85847'}}>{recorder.error || location.error}</Text>}
    </ScrollView>:<SwipeArea onSwipe={setPanelOpen} style={{paddingHorizontal:16,gap:10}}><Text numberOfLines={1} style={{color:panelP.muted}}>{active?`${tripDuration(startedAt,now)} · ${distanceLeft(meters,n.unit)} · ${profile.name}`:profile.name}</Text><Button title={active?'Recording controls':'Choose vehicle & record'} icon={active?'options-outline':'recording-outline'} onPress={()=>setPanelOpen(true)} /></SwipeArea>}
    </PaletteProvider></GlassSurface></NativeTabSafeOverlay></View>;
}
