import JoinRequestBanner from '../../../components/JoinRequestBanner';
import {goBack} from '../../../services/navigation';
import {recordingRedirectReady} from '../../../core/recordingRedirect';
import * as Linking from 'expo-linking';
import RouteWarning from '../../../components/RouteWarning';
import ExplorationRideOptions from '../../../components/ExplorationRideOptions';
import RegroupWarning from '../../../components/RegroupWarning';
import RideBookmarkButton from '../../../components/RideBookmarkButton';
import {useMapBrowsing} from '../../../services/useMapBrowsing';
import GroupCameraPreview from '../../../components/GroupCameraPreview';
import {useGroupActivity} from '../../../groups/useGroupActivity';
import {currentActivityExtras} from '../../../services/activityExtras';
import {recordingActivity} from '../../../core/liveActivity';
import {useRecordingActivity,updateRecordingActivity} from '../../../services/useNavigationActivity';
import GroupRiding from '../../../components/GroupRiding';
import {useRideGroup} from '../../../groups/useRideGroup';
import {consumeRecordingStart,subscribeRecordingStart,takeRecordingRedirect} from '../../../services/recordingStartRequest';
import {useRideHeading} from '../../../services/useRideHeading';
import {publicError} from '../../../core/publicErrors';
import {t} from '../../../i18n/core';
import Text from '../../../components/LocalizedText';
import VehicleBatteryBadge from '../../../components/VehicleBatteryBadge';
import {useBluetoothLease,useBluetoothVehicle,useBluetoothPreferences} from '../../../bluetooth/react';
import VehicleTelemetryPanel from '../../../components/VehicleTelemetryPanel';
import {dashboardReading} from '../../../bluetooth/policy';
import {metricVisible} from '../../../bluetooth/preferences';
import {Ionicons} from '@expo/vector-icons';
import MapControls from '../../../components/MapControls';
import GlassSurface from '../../../components/GlassSurface';
import SwipeArea from '../../../components/SwipeArea';
import React, {useEffect,useMemo,useState,useRef} from 'react';
import {router,useNavigation,useIsFocused} from 'expo-router';
import {View, ScrollView, Pressable, useWindowDimensions, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useScreenWake} from '../../../services/useScreenWake';
import NativeTabSafeOverlay, {usesLiquidGlassTabs} from '../../../components/NativeTabSafeOverlay';
import RideMap from '../../../components/RideMap';
import VehicleSelector from '../../../components/VehicleSelector';
import {Button,IconButton,styles,usePalette,PaletteProvider} from '../../../components/ui';
import {useStore} from '../../../services/store';
import {useTripRoadLimit} from '../../../services/useTripRoadLimit';
import {useLocation} from '../../../services/useLocation';
import {useTripLocation} from '../../../services/useTripLocation';
import {useHeading} from '../../../services/useHeading';
import {useMotion} from '../../../services/useSensors';
import {useRideRecorder} from '../../../services/useRideRecorder';
import {useDownloadedMaps} from '../../../services/useDownloadedMaps';
import {bearing,displaySpeed,distanceLeft,freshFix,forwardHeading} from '../../../core/rideView';
import {tripDuration,tripAverage} from '../../../core/tripDashboard';
import {batteryLabel} from '../../../core/vehicles';
function KeepAwake(){useScreenWake();return null;}
export default function RecordTrip(){
  const focused=useIsFocused();
  const [startRequested]=useState(consumeRecordingStart),autoStarted=useRef(false);
  const [externalLink,setExternalLink]=useState(takeRecordingRedirect),[externalBackground,setExternalBackground]=useState(!!externalLink),[reviewRoute,setReviewRoute]=useState(false),[externalError,setExternalError]=useState(''),externalOpening=useRef<string|null>(null);
  const p=usePalette(),insets=useSafeAreaInsets(),{width,height}=useWindowDimensions(),navigation=useNavigation();
  const {profile,navigationOptions:n,lockVehicle,vehicleLocked,updateNavigationOptions}=useStore();
  const [panelOpen,setPanelOpen]=useState(true),[explorationRoute,setExplorationRoute]=useState<import('../../../core/types').Route|null>(null);
  const [contentHeight,setContentHeight]=useState(0),[headerHeight,setHeaderHeight]=useState(70);
  const [active,setActive]=useState(false),[saving,setSaving]=useState(false),[now,setNow]=useState(Date.now()),[peak,setPeak]=useState(0),[follow,setFollow]=useState(true);
  const leaving=useRef(false),savingRef=useRef(false);
  const [controlsHeight,setControlsHeight]=useState(height),nativeTabs=usesLiquidGlassTabs();
  const bottomObstruction=nativeTabs?Math.max(0,height-controlsHeight):0;
  const metadata=useMemo(()=>explorationRoute??({id:`free-trip-${Date.now()}`,name:`Free ride · ${new Date().toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}`,startLabel:'Trip start',endLabel:'Trip finish'}),[explorationRoute]);
  const mapBrowsing=useMapBrowsing(active,()=>setFollow(true));
  const motion=useMotion(active),compass=useHeading(active),recorder=useRideRecorder(active,true,false,metadata,profile,motion,compass,n.askBatteryUsage);
  const recordFix=recorder.accept,recordSnapshot=recorder.snapshot;
  const accept=React.useCallback(async (fix:import('../../../core/types').Fix)=>{if(fix.speed!==null)setPeak(v=>Math.max(v,fix.speed!*3.6));await recordFix(fix);const summary=recordSnapshot();if(n.liveActivities&&summary)await updateRecordingActivity({...recordingActivity(fix,summary.meters,summary.startedAt,n.unit,fix.timestamp),...currentActivityExtras(profile.id,fix.timestamp)});},[recordFix,recordSnapshot,n.liveActivities,n.unit,profile.id]);
  const location=useTripLocation(active,n.backgroundNavigation||externalBackground,accept),preview=useLocation(focused&&!active);
  const fix=active ? location.fix : preview.fix,valid=freshFix(fix,now),position=fix?.coordinate;
  useBluetoothLease(profile.id,active);
  const bluetooth=useBluetoothVehicle(profile.id),{preferences:bluetoothPreferences}=useBluetoothPreferences();
  const reported=active && metricVisible(bluetoothPreferences,'speed')?dashboardReading(bluetooth,profile.id,'speed',now):undefined;
  const currentSpeed=reported && typeof reported.value==='number'?reported.value*3.6:valid && fix?.speed!=null?fix.speed*3.6:null;
  useGroupActivity(active,async()=>{if(await recorder.finish()===false)return false;leaving.current=true;setActive(false);lockVehicle(false);return true;});
  const groupRide=useRideGroup(active,valid?position??null:null,null);
  const roadLimit=useTripRoadLimit(active,fix,now);
  const offlineMap=useDownloadedMaps(n.downloadedMaps,position,null);
  const meters=recorder.record?.meters || 0,startedAt=recorder.record?.startedAt || now,unit=n.unit==='mi'?'mph':'km/h';
  useRecordingActivity(active&&n.liveActivities,{...recordingActivity(fix,meters,startedAt,n.unit,now,currentSpeed),...currentActivityExtras(profile.id,now)});
  const trail=recorder.record?.trace;
  const trailHeading=useMemo(()=>{const segment=trail?.at(-1);return segment && segment.length>1?bearing(segment[segment.length-2],segment.at(-1)!):null;},[trail]);
  const heading=useRideHeading(fix,compass,n.compass,fix?.heading!==undefined&&valid?forwardHeading(null,undefined,fix):{heading:trailHeading??0,source:'Travel direction'},now,`${metadata.id}-${active}`).heading;
  useEffect(()=>{if(!focused&&!active)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[focused,active]);
  useEffect(()=>{if(active){lockVehicle(true);return()=>lockVehicle(false);}},[active,lockVehicle]);
  // Returning to another tab leaves the dashboard mounted; going back ends and checkpoints the recording.
  useEffect(()=>navigation.addListener('beforeRemove',event=>{if(active && !leaving.current){event.preventDefault();void finish();}}),[navigation,active]); // eslint-disable-line react-hooks/exhaustive-deps
  async function finish(){if(savingRef.current)return;savingRef.current=true;setSaving(true);const saved=await recorder.finish();savingRef.current=false;setSaving(false);if(saved!==false){leaving.current=true;setActive(false);router.replace('/offline/rides');}}
  useEffect(()=>{if(startRequested&&!autoStarted.current&&!vehicleLocked){autoStarted.current=true;setActive(true);}},[startRequested,vehicleLocked]);
  useEffect(()=>subscribeRecordingStart(()=>{if(!active&&!vehicleLocked&&consumeRecordingStart()){const redirect=takeRecordingRedirect();setExternalLink(redirect);setExternalBackground(!!redirect);leaving.current=false;setPeak(0);setActive(true);setPanelOpen(false);setFollow(true);}}),[active,vehicleLocked]);
  useEffect(()=>{if(!externalLink||!recordingRedirectReady(active,recorder.record?.startedAt,location.fix,location.backgroundReady,Platform.OS==='web'))return;if(externalOpening.current===externalLink)return;const url=externalLink;externalOpening.current=url;void Linking.openURL(url).then(()=>setExternalLink(null)).catch(()=>setExternalError('Could not open that map app. Try the other app or return to the planner.'));},[externalLink,active,recorder.record,location.fix,location.backgroundReady]);
  function startRecording(){leaving.current=false;setPeak(0);setActive(true);setPanelOpen(false);setFollow(true);}
  const panelP = p;
  const metric=(label:string,value:string)=><View key={label} style={{minWidth:130,flex:1,gap:4}}><Text style={{color:panelP.muted,fontSize:12}}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{color:panelP.text,fontSize:22,fontWeight:'800',fontVariant:['tabular-nums']}}>{value}</Text></View>;
  return <View style={{flex:1,backgroundColor:p.bg}}>{active && <KeepAwake />}<RideMap bookmarks={active?recorder.record?.bookmarks:undefined} scratchContext={active?'ride':'home'} groupRiders={n.groupPins&&groupRide.code?groupRide.snapshot?.members.filter(m=>m.id!==groupRide.selfId)??[]:[]} trace={active?trail:undefined} routes={explorationRoute?[explorationRoute]:[]} selected={explorationRoute} position={position} follow={follow} onPan={()=>{setFollow(false);mapBrowsing.touch();}} heading={heading} navigating={active} tilted={n.tilted} offlineMap={offlineMap} transit={n.transit} traffic={n.traffic} followPadding={{top:insets.top+75+Math.max(0,(height-bottomObstruction-245)*.42),bottom:bottomObstruction+170,left:20,right:20}} />
    <NativeTabSafeOverlay onHeight={setControlsHeight}><GroupCameraPreview active={active} bottom={width>=800?16:(panelOpen?Math.min(controlsHeight*.6,480,headerHeight+(contentHeight||480)):160)+24}/><View style={{position:'absolute',top:insets.top+12,left:16+insets.left,right:16+insets.right,flexDirection:'row',justifyContent:'space-between'}}><IconButton label={t(active?'Finish recording':'Back to Recorded Rides')} icon={active?'stop-circle-outline':'chevron-back'} disabled={saving} onPress={()=>active ? void finish() : goBack('/offline/rides')} /></View>{active&&<View style={{position:'absolute',top:insets.top+12,left:76+insets.left,right:76+insets.right,maxWidth:480}}><RegroupWarning/><JoinRequestBanner/></View>}<MapControls right={12+insets.right} top={insets.top+162} follow={follow} compass={n.compass} tilted={n.tilted} resume={()=>{mapBrowsing.cancel();setFollow(true);}} toggleCompass={()=>updateNavigationOptions({compass:!n.compass})} toggleTilt={()=>updateNavigationOptions({tilted:!n.tilted})} />
    <View style={{position:'absolute',top:insets.top+78,left:16+insets.left,gap:8,alignItems:'center'}}><View style={[styles.card,{backgroundColor:p.card,padding:12,alignItems:'center'}]}><Text style={{color:currentSpeed!==null && currentSpeed>Math.min(profile.maxSpeed,profile.ridingLimit,roadLimit ?? Infinity)+1?'#D85847':p.text,fontSize:34,fontWeight:'800'}}>{currentSpeed!==null ? displaySpeed(currentSpeed,n.unit).toFixed(0) : '—'}</Text><Text style={{color:p.muted,fontSize:12}}>{reported?.source==='simulator'?'Demo · ':reported?'Vehicle · ':''}{unit}</Text>{!reported&&fix?.speed!==null&&fix?.speed!==undefined&&fix?.speedSource==='estimated'&&<Text style={{color:'#E5B84B',fontSize:10,textAlign:'center'}}>Estimated</Text>}</View><View accessibilityLabel={t(`Mapped road speed limit ${roadLimit===null ? 'unknown' : displaySpeed(roadLimit,n.unit).toFixed(0)+' '+unit}`)} style={{borderRadius:30,width:60,height:60,borderWidth:5,borderColor:'#D85847',backgroundColor:'#fff',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#162C35',fontSize:24,fontWeight:'800'}}>{roadLimit===null?'—':displaySpeed(roadLimit,n.unit).toFixed(0)}</Text></View><Text style={{color:p.muted,backgroundColor:p.card,padding:5,borderRadius:6,fontSize:10}}>{roadLimit===null?'Limit unknown':`Road · ${unit}`}</Text>{active && <VehicleBatteryBadge vehicleId={profile.id} now={now} />}</View>
    <GlassSurface expanded={panelOpen} style={{position:'absolute',bottom:12,left:12+insets.left,right:width>=800?undefined:12+insets.right,width:width>=800?390:undefined,height:panelOpen?Math.min(controlsHeight*.6,480,headerHeight+(contentHeight || 480)):undefined,borderRadius:28}}><PaletteProvider value={panelP}>
      <SwipeArea onSwipe={setPanelOpen} onLayout={e=>setHeaderHeight(e.nativeEvent.layout.height)}><View style={{alignItems:'center',paddingTop:8}}><View style={{width:38,height:4,borderRadius:2,backgroundColor:panelP.muted,opacity:.4}} /></View><View style={{paddingHorizontal:16,paddingVertical:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:panelP.text,fontSize:20,fontWeight:'800'}}>{active?'Recording trip':'Record a trip'}</Text><Pressable accessibilityRole="button" accessibilityLabel={t(panelOpen?'Collapse recording controls':'Expand recording controls')} onPress={()=>setPanelOpen(v=>!v)} style={{padding:8}}><Ionicons name={panelOpen?'chevron-down':'chevron-up'} color={panelP.accent} size={22} /></Pressable></View></SwipeArea>
      {panelOpen?<ScrollView onContentSizeChange={(_,h)=>setContentHeight(h)} style={{flex:1}} contentContainerStyle={{padding:16,paddingTop:0,gap:14,paddingBottom:16}}>
{!active && <><VehicleSelector outlined /><Text style={{color:panelP.muted,lineHeight:20}}>Ride freely with a live dashboard. GPS and available sensors are saved to Recorded Rides, even if automatic Record Rides is off. Road limits use nearby OpenStreetMap roads; your position is sent to Overpass while recording.</Text><ExplorationRideOptions fix={preview.fix} vehicle={profile} unit={n.unit} route={explorationRoute} onRoute={r=>{setExplorationRoute(r);setFollow(!r);}}/><Button title={t("Start recording")} icon="recording-outline" disabled={vehicleLocked || !freshFix(preview.fix)} onPress={()=>{if(explorationRoute?.safetyWarnings?.length)setReviewRoute(true);else startRecording();}} /></>}{active && <><Text style={{color:panelP.muted}}>{profile.name} · Riding limit {displaySpeed(Math.min(profile.maxSpeed,profile.ridingLimit),n.unit).toFixed(0)} {unit}</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:14}}>{metric('Trip time',tripDuration(startedAt,now))}{metric('Travelled',distanceLeft(meters,n.unit))}{metric('Average speed',`${displaySpeed(tripAverage(meters,startedAt,now),n.unit).toFixed(1)} ${unit}`)}{metric('Top speed',`${displaySpeed(peak,n.unit).toFixed(0)} ${unit}`)}</View><Text style={{color:panelP.muted,fontSize:12}}>{batteryLabel(meters,profile)}</Text><RideBookmarkButton fix={fix} onBookmark={recorder.bookmark}/><VehicleTelemetryPanel vehicleId={profile.id} /><GroupRiding active={active} recording/><Button title={t(saving?'Saving…':'Finish & save trip')} icon="stop-circle-outline" disabled={saving} onPress={()=>void finish()} /></>}
      <Text style={{color:panelP.muted,fontSize:12}}>{active?location.status:preview.status}{fix ? ` · GPS ±${Math.round(fix.accuracy)} m` : ''}</Text><Text style={{color:panelP.muted,fontSize:11}}>Mapped road limits can be missing or ambiguous. Follow posted signs. {Platform.OS==='web'?'Keep this page open to record.':''}</Text>{!!(recorder.error || location.error) && <Text style={{color:'#D85847'}}>{publicError(recorder.error || location.error,n.developerMode)}</Text>}
    </ScrollView>:<SwipeArea onSwipe={setPanelOpen} style={{paddingHorizontal:16,paddingBottom:16,gap:10}}><Text numberOfLines={1} style={{color:panelP.muted}}>{active?`${tripDuration(startedAt,now)} · ${distanceLeft(meters,n.unit)} · ${profile.name}`:profile.name}</Text><Button title={t(active?'Recording controls':'Choose vehicle & record')} icon={active?'options-outline':'recording-outline'} onPress={()=>setPanelOpen(true)} /></SwipeArea>}
    {externalLink&&<Text style={{color:panelP.muted,fontSize:12}}>Preparing recording before opening maps…</Text>}
    {!!externalError&&<Text style={{color:'#D85847'}}>{externalError}</Text>}
    {externalLink&&!!(location.error||externalError)&&<Button title={t('Open without recording')} secondary icon="open-outline" onPress={()=>{const url=externalLink;recorder.cancel();setActive(false);setExternalLink(null);void Linking.openURL(url);}}/>}
    </PaletteProvider></GlassSurface></NativeTabSafeOverlay><RouteWarning key={explorationRoute?.id} route={reviewRoute?explorationRoute:null} onCancel={()=>setReviewRoute(false)} onConfirm={()=>{setReviewRoute(false);startRecording();}}/></View>;
}
