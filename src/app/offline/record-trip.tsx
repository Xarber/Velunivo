import React, {useEffect,useMemo,useState,useRef} from 'react';
import {router,useNavigation} from 'expo-router';
import {Text,View,ScrollView,useWindowDimensions,Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useKeepAwake} from 'expo-keep-awake';
import NativeTabSafeOverlay, {usesLiquidGlassTabs} from '../../components/NativeTabSafeOverlay';
import RideMap from '../../components/RideMap';
import VehicleSelector from '../../components/VehicleSelector';
import {Button,IconButton,styles,usePalette} from '../../components/ui';
import {useStore} from '../../services/store';
import {useTripRoadLimit} from '../../services/useTripRoadLimit';
import {useLocation} from '../../services/useLocation';
import {useTripLocation} from '../../services/useTripLocation';
import {useHeading} from '../../services/useHeading';
import {useMotion} from '../../services/useSensors';
import {useRideRecorder} from '../../services/useRideRecorder';
import {useDownloadedMaps} from '../../services/useDownloadedMaps';
import {displaySpeed,distanceLeft,freshFix,forwardHeading} from '../../core/rideView';
import {tripDuration,tripAverage} from '../../core/tripDashboard';
import {batteryLabel} from '../../core/vehicles';
function KeepAwake(){useKeepAwake('velunivo-record-trip');return null;}
export default function RecordTrip(){
  const p=usePalette(),insets=useSafeAreaInsets(),{width,height}=useWindowDimensions(),navigation=useNavigation();
  const {profile,navigationOptions:n,lockVehicle,vehicleLocked,updateNavigationOptions}=useStore();
  const [active,setActive]=useState(false),[saving,setSaving]=useState(false),[now,setNow]=useState(Date.now()),[peak,setPeak]=useState(0),[follow,setFollow]=useState(true);
  const leaving=useRef(false),savingRef=useRef(false);
  const [controlsHeight,setControlsHeight]=useState(height),nativeTabs=usesLiquidGlassTabs();
  const bottomObstruction=nativeTabs?Math.max(0,height-controlsHeight):0;
  const metadata=useMemo(()=>({id:`free-trip-${Date.now()}`,name:`Free ride · ${new Date().toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}`,startLabel:'Trip start',endLabel:'Trip finish'}),[]);
  const motion=useMotion(active),compass=useHeading(active),recorder=useRideRecorder(active,true,false,metadata,profile,motion,compass);
  const recordFix=recorder.accept;
  const accept=React.useCallback(async (fix:import('../../core/types').Fix)=>{if(fix.speed!==null)setPeak(v=>Math.max(v,fix.speed!*3.6));await recordFix(fix);},[recordFix]);
  const location=useTripLocation(active,n.backgroundNavigation,accept),preview=useLocation(!active);
  const fix=active ? location.fix : preview.fix,valid=freshFix(fix,now),position=fix?.coordinate;
  const roadLimit=useTripRoadLimit(active,fix,now);
  const offlineMap=useDownloadedMaps(n.downloadedMaps,position,null);
  const meters=recorder.record?.meters || 0,startedAt=recorder.record?.startedAt || now,unit=n.unit==='mi'?'mph':'km/h';
  const heading=n.compass && compass.heading!==null && now-compass.timestamp<3000 ? compass.heading : forwardHeading(null,undefined,fix).heading;
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{if(active){lockVehicle(true);return()=>lockVehicle(false);}},[active,lockVehicle]);
  // Returning to another tab leaves the dashboard mounted; going back ends and checkpoints the recording.
  useEffect(()=>navigation.addListener('beforeRemove',event=>{if(active && !leaving.current){event.preventDefault();void finish();}}),[navigation,active]); // eslint-disable-line react-hooks/exhaustive-deps
  async function finish(){if(savingRef.current)return;savingRef.current=true;setSaving(true);const saved=await recorder.finish();savingRef.current=false;setSaving(false);if(saved!==false){leaving.current=true;setActive(false);router.replace('/offline/rides');}}
  const metric=(label:string,value:string)=><View key={label} style={{minWidth:100,flex:1,gap:4}}><Text style={{color:p.muted,fontSize:12}}>{label}</Text><Text style={{color:p.text,fontSize:22,fontWeight:'800'}}>{value}</Text></View>;
  return <View style={{flex:1,backgroundColor:p.bg}}>{active && <KeepAwake />}<RideMap routes={[]} selected={null} position={position} follow={follow} onPan={()=>setFollow(false)} heading={heading} navigating={active} tilted={n.tilted} offlineMap={offlineMap} transit={n.transit} traffic={n.traffic} followPadding={{top:insets.top+75,bottom:bottomObstruction+Math.min(height*.43,360),left:20,right:20}} />
    <NativeTabSafeOverlay onHeight={setControlsHeight}><View style={{position:'absolute',top:insets.top+12,left:16,right:16,flexDirection:'row',justifyContent:'space-between'}}><IconButton label={active?'Finish recording':'Back to Recorded Rides'} icon={active?'stop-circle-outline':'chevron-back'} disabled={saving} onPress={()=>active ? void finish() : router.back()} /><View style={{flexDirection:'row',gap:8}}><IconButton label="Follow my location" icon="navigate-outline" onPress={()=>setFollow(true)} /><IconButton label="Toggle perspective" icon="layers-outline" onPress={()=>updateNavigationOptions({tilted:!n.tilted})} /></View></View>
    <View style={{position:'absolute',top:insets.top+78,left:16,gap:8,alignItems:'center'}}><View style={[styles.card,{backgroundColor:p.card,padding:12,alignItems:'center'}]}><Text style={{color:valid && fix?.speed!=null && fix.speed*3.6>Math.min(profile.maxSpeed,profile.ridingLimit,roadLimit ?? Infinity)+1?'#D85847':p.text,fontSize:34,fontWeight:'800'}}>{valid && fix?.speed!=null ? displaySpeed(fix.speed*3.6,n.unit).toFixed(0) : '—'}</Text><Text style={{color:p.muted,fontSize:12}}>{unit}</Text></View><View accessibilityLabel={`Mapped road speed limit ${roadLimit===null ? 'unknown' : displaySpeed(roadLimit,n.unit).toFixed(0)+' '+unit}`} style={{borderRadius:30,width:60,height:60,borderWidth:5,borderColor:'#D85847',backgroundColor:'#fff',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#162C35',fontSize:24,fontWeight:'800'}}>{roadLimit===null?'—':displaySpeed(roadLimit,n.unit).toFixed(0)}</Text></View><Text style={{color:p.muted,backgroundColor:p.card,padding:5,borderRadius:6,fontSize:10}}>{roadLimit===null?'Limit unknown':`Road · ${unit}`}</Text></View>
    <ScrollView style={{position:'absolute',bottom:nativeTabs?12:Math.max(insets.bottom,12),left:16,right:16,maxHeight:height*.44,maxWidth:width>=800?460:undefined,backgroundColor:p.card,borderRadius:24}} contentContainerStyle={{padding:20,gap:14}}><Text style={{color:p.text,fontSize:23,fontWeight:'800'}}>{active?'Recording trip':'Record a trip'}</Text>{!active && <><VehicleSelector /><Text style={{color:p.muted,lineHeight:20}}>Ride freely with a live dashboard. GPS and available sensors are saved to Recorded Rides, even if automatic Record Rides is off. Road limits use nearby OpenStreetMap roads; your position is sent to Overpass while recording.</Text><Button title="Start recording" icon="recording-outline" disabled={vehicleLocked || !freshFix(preview.fix)} onPress={()=>{setPeak(0);setActive(true);}} /></>}{active && <><Text style={{color:p.muted}}>{profile.name} · Riding limit {displaySpeed(Math.min(profile.maxSpeed,profile.ridingLimit),n.unit).toFixed(0)} {unit}</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:14}}>{metric('Trip time',tripDuration(startedAt,now))}{metric('Travelled',distanceLeft(meters,n.unit))}{metric('Average speed',`${displaySpeed(tripAverage(meters,startedAt,now),n.unit).toFixed(1)} ${unit}`)}{metric('Top speed',`${displaySpeed(peak,n.unit).toFixed(0)} ${unit}`)}</View><Text style={{color:p.muted,fontSize:12}}>{batteryLabel(meters,profile)}</Text><Button title={saving?'Saving…':'Finish & save trip'} icon="stop-circle-outline" disabled={saving} onPress={()=>void finish()} /></>}
      <Text style={{color:p.muted,fontSize:12}}>{active?location.status:preview.status}{fix ? ` · GPS ±${Math.round(fix.accuracy)} m` : ''}</Text><Text style={{color:p.muted,fontSize:11}}>Mapped road limits can be missing or ambiguous. Follow posted signs. {Platform.OS==='web'?'Keep this page open to record.':''}</Text>{!!(recorder.error || location.error) && <Text style={{color:'#D85847'}}>{recorder.error || location.error}</Text>}
    </ScrollView></NativeTabSafeOverlay></View>;
}
