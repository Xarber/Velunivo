import RidingPrompt from '../components/RidingPrompt';
import {coordinateLabel} from '../services/coordinateLabels';
import {subscribeRideSimulation,takeRideSimulation} from '../services/developerRide';
import ReorderRows from '../components/ReorderRows';
import {nearestSavedPlace} from '../core/tripNames';
import {useRideHeading} from '../services/useRideHeading';
import {activityExtras} from '../core/activityTelemetry';
import {getHostPresence,subscribeHostPresence} from '../sharing/hostPresence';
import {publicError} from '../core/publicErrors';
import {t} from '../i18n/core';
import Text from '../components/LocalizedText';
import {minimumRideDistance} from '../core/recordings';
import TripSharing from '../components/TripSharing';
import {routeLink} from '../sharing/model';
import {shareLink} from '../sharing/shareLink';
import MapControls from '../components/MapControls';
import { router, useLocalSearchParams } from 'expo-router';
import screenshotRoute from '../../scripts/screenshot-route.json';
import { useNavigationActivity } from '../services/useNavigationActivity';
import { maneuverDistance, arrivalTime , forwardHeading, freshFix, distanceLeft, displaySpeed } from '../core/rideView';
import React, { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import {View, ScrollView, Pressable, Modal, Platform, StyleSheet, useWindowDimensions} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { motionProps } from '../components/WebMotion';
import TurnDirection from '../components/TurnDirection';
import ActionMenu, { MenuAction } from '../components/ActionMenu';
import { Journey } from '../core/places';
import { cumulative , parseCoordinate } from '../core/geo';
import RideMap from '../components/RideMap';
import SpeedBadges from '../components/SpeedBadges';
import MotionView from '../components/MotionView';
import SwipeArea from '../components/SwipeArea';
import NativeTabSafeOverlay, { usesLiquidGlassTabs } from '../components/NativeTabSafeOverlay';
import RouteWarning from '../components/RouteWarning';
import ExternalMapsWarning from '../components/ExternalMapsWarning';
import { ExternalNavigation } from '../core/externalMaps';
import GlassSurface from '../components/GlassSurface';
import { useLocation } from '../services/useLocation';
import Brand from '../components/Brand';
import VehicleTelemetryPanel from '../components/VehicleTelemetryPanel';
import RideDashboard from '../components/RideDashboard';
import { useHeading } from '../services/useHeading';
import VehicleSelector from '../components/VehicleSelector';
import {useBluetoothLease,useBluetoothPreferences,useBluetoothVehicle} from '../bluetooth/react';
import {routeEnergyLabel} from '../core/energy';
import ScheduleControl from '../components/ScheduleControl';
import { scheduleSummary } from '../core/schedule';
import EndpointPicker from '../components/EndpointPicker';
import { Button, IconButton, styles, usePalette, PaletteProvider } from '../components/ui';
import { useStore } from '../services/store';
import { serverUrl, fetchItinerary, enrichElevation } from '../services/api';
import { shareTrack } from '../services/files';
import { useRideRecorder } from '../services/useRideRecorder';
import { useDownloadedMaps } from '../services/useDownloadedMaps';
import { useRide } from '../services/useRide';
import { useMotion } from '../services/useSensors';
import { estimate, minutes } from '../core/eta';
import {remainingStops,RouteStop,reorderPoints} from '../core/itinerary';
import { Coord, Fix, Route } from '../core/types';
function Awake() { useKeepAwake(); return null; }
export default function Explore() {
  const p = usePalette(), { height, width } = useWindowDimensions();

  const wide = width >= 700, insets = useSafeAreaInsets();
  const [panelOpen, setPanelOpen] = useState(false);
  const [plannerDragging,setPlannerDragging]=useState(false);
  const labelRequests=useRef(new Map<string,number>());
  function cancelLabel(key:string){labelRequests.current.set(key,(labelRequests.current.get(key)||0)+1);}
  function cancelLabels(){for(const key of labelRequests.current.keys())cancelLabel(key);}
  const [externalJourney, setExternalJourney] = useState<ExternalNavigation | null>(null);
  const warningSimulation = useRef(false);
  const [warningRoute, setWarningRoute] = useState<Route | null>(null);
  const [mapHeight, setMapHeight] = useState(height);
  const [overlayHeight, setOverlayHeight] = useState(height);
  const glassTabs = usesLiquidGlassTabs();
  const controlsHeight = glassTabs ? Math.min(mapHeight, overlayHeight) : mapHeight;
  const bottomObstruction = glassTabs ? Math.max(0, mapHeight - controlsHeight) : 0;
  const [panelContentHeight,setPanelContentHeight]=useState(0),[panelHeaderHeight,setPanelHeaderHeight]=useState(70);

  const [trafficAvailable, setTrafficAvailable] = useState(Platform.OS === 'ios');
  const [departure, setDeparture] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'depart' | 'arrive'>('depart');
  useEffect(() => { if (serverUrl) fetch(`${serverUrl}/health`).then(r => r.json()).then(r => setTrafficAvailable(!!r.trafficConfigured)).catch(() => {}); }, []);
  const { routes, selected, select, setRoutes, profile, save, ready, lockVehicle, vehicleLocked, navigationOptions, updateNavigationOptions, pendingJourney, requestJourney, places } = useStore();
  const [actions, setActions] = useState<MenuAction[] | null>(null), [turnList, setTurnList] = useState(false), [previewPin, setPreviewPin] = useState<Coord | undefined>();
  const [notice, setNotice] = useState('');
  const [planner, setPlanner] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [stops,setStops]=useState<RouteStop[]>([]),[stopPick,setStopPick]=useState<number|null>(null);
  const selectedRef=useRef(selected);useEffect(()=>{selectedRef.current=selected;},[selected]);
  const activeRef=useRef(false);
  const reroutePending=useRef<Route|null>(null);
  const [start, setStart] = useState('Current location'), [end, setEnd] = useState('');
  const [startPoint, setStartPoint] = useState<Coord | undefined>(), [endPoint, setEndPoint] = useState<Coord | undefined>();
  const [gpsStart, setGpsStart] = useState(true), [locating, setLocating] = useState(false), [optionsOpen, setOptionsOpen] = useState(false);
  const [overview, setOverview] = useState(false), [overviewRequest, setOverviewRequest] = useState(0);
  const locationRequest = useRef(0), planRequest = useRef(0);
  const overviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [now, setNow] = useState(Date.now());
  const webLeft = Platform.OS === 'web' ? insets.left : 0, webRight = Platform.OS === 'web' ? insets.right : 0;
  const cancelRecording=useRef<()=>void>(()=>{});
  const recordingAccept = useRef<(fix: Fix, arrived?: boolean) => void | Promise<void>>(() => {});
  const [picking, setPicking] = useState<'start' | 'end' | null>(null), [follow, setFollow] = useState(true);
  const ride = useRide(selected, profile, navigationOptions, (fix,arrived) => recordingAccept.current(fix,arrived),()=>cancelRecording.current(),reroute), motion = useMotion((navigationOptions.motion && ride.mode !== 'idle') || (navigationOptions.recordRides && ride.mode === 'gps'));
  const active = ride.mode !== 'idle', g = ride.progress;
  const { capture } = useLocalSearchParams<{capture?:string}>();
  const capturePrepared=useRef(false),captureStarted=useRef(false);
  useEffect(()=>{
    // Simulator QA builds only. Production IPA/APK/web ignore this URL.
    if(process.env.EXPO_PUBLIC_CAPTURE_FIXTURES!=='1'||capture!=='navigation'||!ready||capturePrepared.current)return;
    capturePrepared.current=true;
    const route=screenshotRoute as unknown as Route;setRoutes([route]);select(route);
    updateNavigationOptions({voice:false,volume:'off',liveActivities:false,recordRides:false});
    setPanelOpen(false);setFollow(true);
  },[capture,ready,select,setRoutes,updateNavigationOptions]);
  useEffect(()=>{
    if(process.env.EXPO_PUBLIC_CAPTURE_FIXTURES!=='1'||capture!=='navigation'||!capturePrepared.current||captureStarted.current||selected?.id!==screenshotRoute.id)return;
    captureStarted.current=true;ride.start(true);
  },[capture,selected,ride]);

  const expandedPanel = planner || panelOpen || (wide && !active);
  const panelP = expandedPanel ? { ...p, dark: true, bg: '#071118', card: '#15222C', text: '#F6FAFC', muted: '#ADBCC6', line: '#30434B', accent: '#64DCC5' } : p;
  const live = useLocation(ride.mode === 'idle');
  const mapFix = active ? ride.fix : live.fix;
  const mapPosition = mapFix && mapFix.accuracy <= 100 && now - mapFix.timestamp <= 15000 ? mapFix.coordinate : undefined;
  const visibleRoutes = useMemo(() => active && selected ? [selected] : routes, [active, selected, routes]);
  const expandedMax=active?Math.min(controlsHeight*.6,480):Math.max(180,controlsHeight-insets.top-112);
  const visiblePanelHeight=expandedPanel?Math.min(expandedMax,panelHeaderHeight+(panelContentHeight || expandedMax)):undefined;
  const compass = useHeading((navigationOptions.compass || (navigationOptions.recordRides && ride.mode === 'gps')) && !!mapPosition);
  const direction = forwardHeading(selected, g?.index, freshFix(mapFix, now) ? mapFix : null);
  const {preferences:bluetoothPreferences}=useBluetoothPreferences();
  useBluetoothLease(profile.id,ride.mode==='gps' || (ride.mode==='simulation' && navigationOptions.developerMode && bluetoothPreferences.simulateTelemetry));
  const recorder = useRideRecorder(ride.mode === 'gps', navigationOptions.recordRides, g?.arrived === true, selected, profile, motion, compass, navigationOptions.askBatteryUsage,minimumRideDistance(selected)); useEffect(() => { recordingAccept.current = recorder.accept;cancelRecording.current=recorder.cancel; }, [recorder.accept,recorder.cancel]);
  const offlineMap = useDownloadedMaps(navigationOptions.downloadedMaps, mapPosition, selected);
  activeRef.current=ride.mode==='gps';
  const compassFresh = navigationOptions.compass && compass.heading !== null;
  const resolvedHeading=useRideHeading(mapFix,compass,navigationOptions.compass,direction,now,`${selected?.id||'map'}-${ride.mode}`);
  const heading=resolvedHeading.heading,headingSource=ride.mode==='simulation'?'Demo travel direction':resolvedHeading.source;
  const precise = freshFix(ride.fix, now);
  useEffect(() => { const clock = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(clock); }, []);
  useEffect(() => () => { if (overviewTimer.current) clearTimeout(overviewTimer.current); }, []);
  useEffect(() => { lockVehicle(active); return () => lockVehicle(false); }, [active, lockVehicle]);
  const fitPadding = useMemo(() => {
    if (picking) return { top: 100, bottom: 55 + bottomObstruction, left: 24, right: 24 };
    if (wide && !active) return { top: 90, bottom: 45 + bottomObstruction, left: 425, right: 60 };
    return { top: active ? 145 : 115, bottom: bottomObstruction + (active ? 205 : Math.min((visiblePanelHeight ?? 176) + 25, controlsHeight * .5)), left: 24, right: 70 };
  }, [wide, active, picking, visiblePanelHeight, controlsHeight, bottomObstruction]);
  const followPadding = useMemo(() => ({ ...fitPadding, top: fitPadding.top + Math.max(0, (mapHeight - fitPadding.top - fitPadding.bottom) * .42) }), [fitPadding, mapHeight]);
  const eta = selected ? estimate(selected, profile, active && g && !g.offRoute ? g.along : 0) : null;
  const bluetoothSnapshot=useBluetoothVehicle(profile.id);
  const sharingPresence=useSyncExternalStore(subscribeHostPresence,getHostPresence,getHostPresence);
  const activityProps = useMemo<import('../core/liveActivity').NavigationActivity>(()=>({...activityExtras(bluetoothSnapshot,bluetoothPreferences,profile.id,sharingPresence,now),turn:(ride.mode === 'simulation' ? 'Simulation · ' : '') + (g?.offRoute ? 'Off route · stop safely to replan' : g?.next?.text || 'Follow the route'),symbol:g?.next?.sign === 4 || g?.next?.sign===5 ? 'flag.fill' : g?.next?.sign && g.next.sign < 0 ? 'arrow.turn.up.left' : g?.next?.sign && g.next.sign > 0 ? 'arrow.turn.up.right' : 'arrow.up',distance:g?.maneuverMeters === undefined ? '—' : maneuverDistance(g.maneuverMeters,navigationOptions.unit),arrival:eta ? arrivalTime(eta.seconds,now) : '—',minutes:eta ? minutes(eta.seconds) : '—',remaining:eta ? distanceLeft(eta.meters,navigationOptions.unit) : '—'}),[g,eta,now,navigationOptions.unit,ride.mode,bluetoothSnapshot,bluetoothPreferences,profile.id,sharingPresence]);
  const activity = useNavigationActivity(active && !g?.arrived && navigationOptions.liveActivities, activityProps);
  const run = async (task: () => Promise<unknown>) => { try { await task(); } catch (e) { setNotice(e instanceof Error ? e.message : String(e)); } };
  async function plan(journey?: Journey) {
    const request = ++planRequest.current; setError(''); setExternalJourney(null); setBusy(true);
    try {
      if((journey?.stops||stops).some(s=>s.coordinate.some(n=>!Number.isFinite(n))))throw new Error('Choose a location for every stop.');
      let a: Coord, b: Coord;
      if (journey) a = journey.startCurrent ? await resolveCurrentLocation() : journey.start;
      else if (gpsStart) a = await resolveCurrentLocation();
      else { try { a = startPoint || parseCoordinate(start); } catch { throw new Error('Search your start address and choose a result, or pick your start on the map.'); } }
      try { b = journey?.end || (end === 'Current location' ? await currentArrival() : endPoint || parseCoordinate(end)); } catch { throw new Error('Search your destination and choose a result, or pick it on the map.'); }
      const readable=(label:string,c:Coord)=>{try{parseCoordinate(label);return coordinateLabel(c,places);}catch{return Promise.resolve(label);}};
      const [firstLabel,lastLabel,itinerary]=await Promise.all([readable(journey?.startLabel||start,a),readable(journey?.endLabel||end,b),Promise.all((journey?.stops||stops).map(async s=>({...s,label:await readable(s.label,s.coordinate)})))]);
      if(request!==planRequest.current)return;
      const results = await Promise.allSettled([fetchItinerary(a, b, itinerary, 'bike', profile), fetchItinerary(a, b, itinerary, 'car', profile)]);
      if (request !== planRequest.current) return;
      const good: Route[] = [], failures: string[] = [];
      results.forEach((r, i) => r.status === 'fulfilled' ? good.push({ ...r.value, startLabel:firstLabel,endLabel:lastLabel }) : failures.push(`${i === 0 ? 'Bicycle' : 'Car-road'}: ${r.reason.message}`));
      if (good.length) { void Promise.all(good.map(enrichElevation)).then(enriched=>{if(request===planRequest.current){setRoutes(enriched);select(enriched.find(r=>r.id===selectedRef.current?.id)||enriched[0]);}}); setPreviewPin(undefined); setRoutes(good); select(good[0]); setPlanner(false); }
      else { setExternalJourney({ start: a, end: b, errors: failures }); setPlanner(false); }
      setError(failures.join('\n'));
    } catch (e) { if (request === planRequest.current) setError(e instanceof Error ? e.message : String(e)); }
    finally { if (request === planRequest.current) setBusy(false); }
  }
  useEffect(() => { if (!pendingJourney || active) return; const j=pendingJourney; // Consume an external Library request to populate the existing planner.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestJourney(null); setStart(j.startLabel); setEnd(j.endLabel); setStartPoint(j.startCurrent ? undefined : j.start); setEndPoint(j.end); setGpsStart(!!j.startCurrent); setDeparture('');setStops(j.stops||[]); setPreviewPin(undefined); void plan(j);
    // Explicit endpoints are carried by the queued journey, not render-time input state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingJourney, active]);
  function shareRoute() { if (!selected) return; const r=selected; setActions([{title:'Save to Library',icon:'bookmark-outline',onPress:()=>void run(async()=>{await save(r);setNotice('Saved to your Library.');})},{title:'Share route link',icon:'link-outline',onPress:()=>void run(()=>shareLink(routeLink(r),'Plan this Velunivo route'))},{title:'Export GPX',icon:'share-outline',onPress:()=>void run(()=>shareTrack(r.coordinates))}]); }
  async function resolveCurrentLocation() {
    const request = ++locationRequest.current;
    if (ride.mode === 'simulation' && freshFix(ride.fix, Date.now())) { const coordinate = ride.fix!.coordinate; setStart('Simulation location'); setStartPoint(coordinate); setGpsStart(false); return coordinate; }
    if (live.fix && live.fix.accuracy <= 100 && Date.now() - live.fix.timestamp <= 15000) { setStart('Current location'); setStartPoint(live.fix.coordinate); setGpsStart(true); return live.fix.coordinate; }
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') throw new Error('Allow precise location to use your current position.');
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pos: Location.LocationObject;
    try { pos = await Promise.race([Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('GPS took too long. Try again or choose a start on the map.')), 20000); })]); } finally { if (timer) clearTimeout(timer); }
    if (pos.coords.accuracy === null || pos.coords.accuracy > 100) throw new Error('GPS is too approximate. Enable precise location or choose a start on the map.');
    if (request !== locationRequest.current) throw new Error('Location request cancelled after the start changed.');
    const coordinate: Coord = [pos.coords.longitude, pos.coords.latitude]; setStart('Current location'); setStartPoint(coordinate); setGpsStart(true); return coordinate;
  }
  async function currentArrival() { const old={start,startPoint,gpsStart}; const c=await resolveCurrentLocation(); setStart(old.start);setStartPoint(old.startPoint);setGpsStart(old.gpsStart);return c; }
  function picked(c:Coord){if(!picking)return;const target=picking,index=stopPick,key=index!==null?`stop-${index}`:target;
    const initial=nearestSavedPlace(c,places)?.name||`${c[1].toFixed(6)}, ${c[0].toFixed(6)}`;
    if(index!==null)setStops(v=>v.map((s,i)=>i===index?{coordinate:c,label:initial}:s));else if(target==='start'){manualStart();setStart(initial);setStartPoint(c);}else{setEnd(initial);setEndPoint(c);}
    cancelLabel(key);const request=labelRequests.current.get(key);setStopPick(null);setPicking(null);setPlanner(true);
    void coordinateLabel(c,places).then(label=>{if(labelRequests.current.get(key)!==request)return;if(index!==null)setStops(v=>v.map((s,i)=>i===index?{...s,label}:s));else if(target==='start')setStart(label);else setEnd(label);});
  }
  function cancelPendingLocation() { locationRequest.current++; setLocating(false); }
  function manualStart() {cancelLabel('start'); cancelPendingLocation();setError(''); setGpsStart(false); }
  function beginRide(simulate = false, confirmed = false) { if (vehicleLocked && !active) {setNotice('Finish your trip recording in Library before starting navigation.');return;} if (!confirmed && selected?.safetyWarnings?.length) { warningSimulation.current = simulate; setWarningRoute(selected); return; } setNow(Date.now()); setPanelOpen(false); resumeFollowing(); ride.start(simulate); }
  useEffect(()=>subscribeRideSimulation(()=>{if(takeRideSimulation()&&navigationOptions.developerMode&&selected&&!active)beginRide(true);}),[navigationOptions.developerMode,selected,active]); // eslint-disable-line react-hooks/exhaustive-deps
  function openPlanner() {
    setPreviewPin(undefined); setPlanner(true); setPanelOpen(true);
    if (gpsStart && !locating) { setLocating(true); const pending = resolveCurrentLocation(), request = locationRequest.current; void pending.catch(e => { if (request === locationRequest.current) setError(e.message); }).finally(() => { if (request === locationRequest.current) setLocating(false); }); }
  }
  function showOverview() {
    if (overviewTimer.current) clearTimeout(overviewTimer.current);
    setPanelOpen(false); setOverview(true); setOverviewRequest(n => n + 1);
    overviewTimer.current = setTimeout(() => { setOverview(false); overviewTimer.current = null; }, 15000);
  }
  function resumeFollowing() { if (overviewTimer.current) clearTimeout(overviewTimer.current); overviewTimer.current = null; setOverview(false); setFollow(true); }
  function clearRide() {cancelLabels();
    setPreviewPin(undefined); setTurnList(false); setExternalJourney(null); setWarningRoute(null); planRequest.current++; setBusy(false); locationRequest.current++; setLocating(false); ride.stop(); setRoutes([]); select(null); setStart('Current location'); setStartPoint(undefined); setGpsStart(true); setEnd(''); setEndPoint(undefined); setStops([]); setDeparture(''); setScheduleMode('depart'); setOptionsOpen(false);  setPicking(null); setPlanner(false); setPanelOpen(false); setError(''); resumeFollowing();
  }
  async function reroute(fix:Fix,index:number){
    const original=selected;if(!original||original.kind==='track')return;
    const request=++planRequest.current;
    const replacement=await fetchItinerary(fix.coordinate,original.coordinates.at(-1)!,remainingStops(original,index),original.kind,profile);
    if(request!==planRequest.current||!activeRef.current)return;
    const next={...replacement,id:original.id,startLabel:'Current location',endLabel:original.endLabel};
    setStart('Current location');setStartPoint(fix.coordinate);setGpsStart(true);
    if(next.safetyWarnings?.length){reroutePending.current=next;setWarningRoute(next);return;}
    setRoutes([next]);select(next);setNotice('Route updated from your current position.');
  }
  const plannerPoints=[{label:start,coordinate:startPoint,current:gpsStart},...stops.map(s=>({...s,current:s.label==='Current location'})),{label:end,coordinate:endPoint,current:end==='Current location'}];
  const pointLabel=(i:number)=>t(i===0?'Start':i===plannerPoints.length-1?'Destination':`Stop ${i}`);
  function reorderPlanner(from:number,to:number){cancelLabels();const points=reorderPoints(plannerPoints,from,to),first=points[0],last=points.at(-1)!;cancelPendingLocation();setStart(first.label);setStartPoint(first.coordinate);setGpsStart(first.current);setError('');setEnd(last.label);setEndPoint(last.coordinate);setStops(points.slice(1,-1).map(s=>({label:s.label,coordinate:s.coordinate||(s.current?live.fix?.coordinate:undefined)||[NaN,NaN]})));}
  function changePlannerPoint(i:number,label:string){cancelLabel(i===0?'start':i===plannerPoints.length-1?'end':`stop-${i-1}`);if(i===0){manualStart();setStart(label);setStartPoint(undefined);}else if(i===plannerPoints.length-1){setEnd(label);setEndPoint(undefined);}else setStops(v=>v.map((s,j)=>j===i-1?{...s,label,coordinate:[NaN,NaN]}:s));}
  function choosePlannerPoint(i:number,label:string,coordinate:Coord){cancelLabel(i===0?'start':i===plannerPoints.length-1?'end':`stop-${i-1}`);if(i===0){manualStart();setStart(label);setStartPoint(coordinate);}else if(i===plannerPoints.length-1){setEnd(label);setEndPoint(coordinate);}else setStops(v=>v.map((s,j)=>j===i-1?{label,coordinate}:s));}
  // Restore complete saved itineraries when the selected route changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{if(!selected||active)return;cancelLabels();setStops(selected.waypoints||[]);setStart(selected.startLabel||'Current location');setEnd(selected.endLabel||'');setStartPoint(selected.coordinates[0]);setEndPoint(selected.coordinates.at(-1));setGpsStart(selected.startLabel==='Current location');},[selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const plannerContent=<View style={{gap:14}}>

      <Text style={[styles.subtitle, { color: panelP.muted }]}>Search an address or choose a point on the map. Compare bicycle and car-road routes at your riding speed.</Text>
      <View style={[styles.card,{backgroundColor:panelP.card,padding:10,gap:0}]}><ReorderRows onDraggingChange={setPlannerDragging} items={plannerPoints} disabled={busy||locating} label={(_,i)=>pointLabel(i)} onReorder={reorderPlanner} render={(point,i)=><View style={{flexDirection:'row',alignItems:'flex-start',gap:4}}><View style={{width:24,minHeight:48,alignItems:'center',justifyContent:'center'}}>{i===0||i===plannerPoints.length-1?<Ionicons name={i===0?'radio-button-on-outline':'flag'} color={panelP.accent} size={19}/>:<Text style={{color:panelP.accent,fontWeight:'800'}}>{i}</Text>}</View><View style={{flex:1,minWidth:0}}><EndpointPicker compact disabled={busy} label={pointLabel(i)} value={point.label} onChange={value=>changePlannerPoint(i,value)} onSelect={(label,coordinate)=>choosePlannerPoint(i,label,coordinate)} onLocation={()=>void run(async()=>{const coordinate=await currentArrival();choosePlannerPoint(i,'Current location',coordinate);if(i===0)setGpsStart(true);})} onMap={()=>{cancelPendingLocation();setStopPick(i>0&&i<plannerPoints.length-1?i-1:null);setPicking(i===0?'start':'end');setPlanner(false);}}/></View>{i>0&&i<plannerPoints.length-1&&<Pressable accessibilityRole="button" accessibilityLabel={t('Remove stop')} disabled={busy} onPress={()=>{cancelLabels();setStops(v=>v.filter((_,j)=>j!==i-1));}} style={{width:28,minHeight:48,alignItems:'center',justifyContent:'center'}}><Ionicons name="remove-circle-outline" color={panelP.muted} size={20}/></Pressable>}</View>}/><Button title={t('Add stop')} icon="add-circle-outline" secondary disabled={busy||stops.length>=12} onPress={()=>setStops(v=>[...v,{label:'',coordinate:[NaN,NaN]}])}/></View>
      <View style={[styles.card, { backgroundColor: panelP.card }]}><VehicleSelector outlined disabled={busy} /></View>
      <View style={[styles.card, { backgroundColor: panelP.card }]}><Button title={t(departure ? scheduleSummary(departure, eta?.seconds, scheduleMode) : 'Depart now')} secondary icon="calendar-outline" onPress={() => setOptionsOpen(v => !v)} />{optionsOpen && <><View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button title={t("Depart at")} icon="time-outline" secondary={scheduleMode !== 'depart'} onPress={() => setScheduleMode('depart')} /></View><View style={{ flex: 1 }}><Button title={t("Arrive by")} icon="flag-outline" secondary={scheduleMode !== 'arrive'} onPress={() => setScheduleMode('arrive')} /></View></View><ScheduleControl value={departure} onChange={setDeparture} /><Text accessibilityRole="alert" style={{ color: '#C75A36', fontSize: 12 }}>Scheduled trips do not use traffic conditions or traffic simulation. Allow extra time for delays.</Text><Button title={t(navigationOptions.traffic ? 'Hide live traffic' : 'Show live traffic')} icon="car-outline" secondary disabled={!trafficAvailable} onPress={() => updateNavigationOptions({traffic:!navigationOptions.traffic})} />{!trafficAvailable && <Text style={{ color: panelP.muted, fontSize: 12 }}>Live traffic needs a configured TomTom server key. It is never included in ETA.</Text>}</>}</View>
      {locating && <Text style={{ color: panelP.muted }}>Finding your current GPS location…</Text>}
      {!!error && <Text style={{ color: '#C75A36' }}>{publicError(error,navigationOptions.developerMode)}</Text>}
      <Button title={t('Plan bicycle & car routes')} loading={busy} disabled={locating} onPress={() => void plan()} />
  </View>;
  return <TripSharing active={ride.mode==='gps' && !g?.arrived} route={selected} position={mapPosition} seconds={eta?.seconds||0} meters={eta?.meters||0} now={now}>{shareControls=><SafeAreaView edges={[]} onLayout={e => setMapHeight(e.nativeEvent.layout.height)} style={{ flex: 1, backgroundColor: p.bg }}>
    {active && <Awake />}<RidingPrompt fix={live.fix} enabled={ready&&!active&&!planner&&!selected&&!vehicleLocked&&!picking} onPlan={openPlanner}/>

    <View style={StyleSheet.absoluteFill}>
      <RideMap completedMeters={active ? ride.completedMeters : undefined} routes={previewPin ? [] : visibleRoutes} selected={previewPin ? null : selected} position={mapPosition} follow={follow && !overview && !previewPin && (active || (!selected && !startPoint && !picking))} onPan={() => setFollow(false)} heading={heading} tilted={navigationOptions.tilted && !overview} overviewRequest={overviewRequest} overview={overview} onPick={picked} transit={navigationOptions.transit} traffic={navigationOptions.traffic} startPoint={previewPin || startPoint} endPoint={previewPin ? undefined : endPoint} offlineMap={offlineMap} planningStops={stops.filter(s=>s.coordinate.every(Number.isFinite))} fitPadding={fitPadding} followPadding={followPadding} navigating={active} />
      {!active && <View pointerEvents="none" style={[s.mapBadge, { backgroundColor: p.card, top: insets.top + (wide ? 24 : 82) }]}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.accent }} /><Text style={{ color: p.text, fontSize: 12, fontWeight: '700' }}>{picking ? `Tap your ${picking === 'start' ? 'start location' : 'destination'}` : selected?.source === 'gpx' ? 'GPX · TRACK PREVIEW' : !selected ? live.fix && !mapPosition ? 'Waiting for fresh GPS…' : live.status : 'ROUTE COMPARISON'}</Text></View>}
      {active && <><GlassSurface style={{ position:'absolute',top:insets.top+12,left:12+webLeft,right:wide ? undefined : 12+webRight,width:wide ? 420 : undefined,borderRadius:24 }}><SwipeArea onSwipe={open=>setTurnList(!open)}><Pressable accessibilityRole="button" accessibilityLabel={t("Show upcoming directions")} onPress={()=>setTurnList(true)}><TurnDirection unit={navigationOptions.unit} sign={g?.next?.sign} meters={g?.maneuverMeters} arrived={g?.arrived} text={g?.offRoute ? 'Off route · stop safely to replan' : g?.next?.text || (selected?.source === 'gpx' ? 'GPX track · turns unavailable' : 'Turn instructions unavailable · follow the mapped route')} status={ride.mode === 'simulation' ? 'Simulation · no live GPS' : ride.status} /></Pressable></SwipeArea></GlassSurface><View style={{ position: 'absolute', left: 12 + webLeft, top: insets.top + 156 }}><SpeedBadges route={selected} profile={profile} fix={ride.fix} index={g?.index} offRoute={g?.offRoute} now={now} unit={navigationOptions.unit} simulation={ride.mode === 'simulation'} /></View></>}

      <MapControls top={insets.top+(active?162:wide?110:170)} right={12+webRight} follow={follow} compass={navigationOptions.compass} tilted={navigationOptions.tilted} overview={overview} resume={resumeFollowing} toggleCompass={()=>updateNavigationOptions({compass:!navigationOptions.compass})} toggleTilt={()=>updateNavigationOptions({tilted:!navigationOptions.tilted})} onOverview={selected && active?showOverview:undefined} />

    </View>
    {!active && <View pointerEvents="box-none" style={[s.header, { top: insets.top + 12, left: 16 + webLeft, right: wide ? undefined : 16 + webRight }]}><GlassSurface style={s.brandCard}><Brand /></GlassSurface><Pressable accessibilityRole="button" accessibilityLabel={t("Plan a ride")} disabled={active || busy} onPress={openPlanner} style={[s.round, { backgroundColor: p.card, opacity:busy?.4:1 }]}><Ionicons name="search" size={22} color={p.text} /></Pressable></View>}
    <NativeTabSafeOverlay onHeight={setOverlayHeight}>
      {previewPin && <View style={{position:'absolute',bottom:195,left:12}}><Button title={t("Back to Where to")} icon="search" onPress={openPlanner} /></View>}
      {picking && <View style={{ position: 'absolute', bottom: 12, left: 12 }}><Button title={t("Cancel map selection")} secondary onPress={() => { setPicking(null); setPlanner(true); }} /></View>}
    {!picking && <GlassSurface expanded={expandedPanel} {...motionProps('sheet')} style={[s.floatingPanel, { backgroundColor: panelP.bg, left: 12 + webLeft, right: wide ? undefined : 12 + webRight, width: wide ? 390 : undefined, bottom: 12, height: visiblePanelHeight }]}>
      {planner?<PaletteProvider value={panelP}><View onLayout={e=>setPanelHeaderHeight(e.nativeEvent.layout.height)} style={{paddingHorizontal:16,paddingTop:20,paddingBottom:12}}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={[styles.title, { color: panelP.text }]}>Where to?</Text><Pressable accessibilityRole="button" accessibilityLabel={t("Close planner")} disabled={busy} onPress={() => setPlanner(false)}><Ionicons name="close-circle" size={30} color={panelP.muted} /></Pressable></View></View><ScrollView scrollEnabled={!plannerDragging} onContentSizeChange={(_,h)=>setPanelContentHeight(h)} keyboardShouldPersistTaps="handled" style={{flex:1}} contentContainerStyle={{paddingHorizontal:16,paddingBottom:20}}>{plannerContent}</ScrollView></PaletteProvider>:<PaletteProvider value={panelP}><SwipeArea onSwipe={setPanelOpen} style={{ paddingTop: 8 }} onLayout={e=>setPanelHeaderHeight(e.nativeEvent.layout.height)}>
      <View style={{ alignItems: 'center', paddingBottom: 6 }}><View style={{ height: 4, width: 38, borderRadius: 2, backgroundColor: panelP.muted, opacity: .4 }} /></View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: panelP.text, fontWeight: '800', fontSize: 20 }}>{active ? 'Trip' : 'Your ride'}</Text>{(!wide || active) && <Pressable accessibilityRole="button" accessibilityLabel={t(panelOpen ? 'Collapse ride controls' : 'Expand ride controls')} onPress={() => setPanelOpen(v => !v)} style={{ padding: 8 }}><Ionicons name={panelOpen ? 'chevron-down' : 'chevron-up'} color={panelP.accent} size={22} /></Pressable>}</View>
      </SwipeArea>
      {(!wide || active) && !panelOpen ? <SwipeArea onSwipe={setPanelOpen}><MotionView {...motionProps('content')} style={{ paddingHorizontal: 16, paddingBottom:16, gap: 10 }}>{active ? <RideDashboard etaOnly compact simulation={ride.mode === 'simulation'} profile={profile} route={selected} fix={ride.fix} index={g?.index} offRoute={g?.offRoute} seconds={eta?.seconds} meters={eta?.meters} now={now} unit={navigationOptions.unit} /> : <Text numberOfLines={1} style={{ color: panelP.muted }}>{selected && eta ? `${selected.name} · ${distanceLeft(eta.meters, navigationOptions.unit)} · ${minutes(eta.seconds)}` : 'Plan your next ride'}</Text>}<View style={{flexDirection:'row',alignItems:'stretch',gap:10}}><View style={{flex:1}}><Button loading={busy} disabled={locating} title={t(active ? 'Ride controls' : busy ? 'Plan a ride' : selected ? 'Start ride' : 'Plan a ride')} icon={active || selected ? 'navigate' : 'search'} onPress={() => active ? setPanelOpen(true) : selected ? beginRide() : openPlanner()} /></View>{!active && !selected && !endPoint && !end.trim() && <IconButton label={t("Record trip")} icon="recording-outline" muted disabled={vehicleLocked || busy} onPress={()=>router.push('/offline/record-trip')} />}</View></MotionView></SwipeArea> : <ScrollView onContentSizeChange={(_,h)=>setPanelContentHeight(h)} {...motionProps('content')} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 14, paddingBottom: 16 }}>
      {active ? <View style={[styles.card, { backgroundColor: panelP.card }]}>
        <RideDashboard etaOnly simulation={ride.mode === 'simulation'} profile={profile} route={selected} fix={ride.fix} index={g?.index} offRoute={g?.offRoute} seconds={eta?.seconds} meters={eta?.meters} now={now} unit={navigationOptions.unit} />
        <Text style={{ color: panelP.muted, fontSize: 12 }}>{profile.name} · Cap {displaySpeed(Math.min(profile.maxSpeed, profile.ridingLimit), navigationOptions.unit).toFixed(0)} {navigationOptions.unit === 'mi' ? 'mph' : 'km/h'} · {eta ? routeEnergyLabel(selected!, profile,active&&g&&!g.offRoute?g.along:0) : 'Range unknown'}</Text>
        <Text style={{ color: panelP.muted, fontSize: 11 }}>{headingSource}{active && navigationOptions.compass && !compassFresh ? ` · ${compass.status}` : ''}{!precise ? ' · Waiting for a precise GPS fix' : ''}</Text>

        <VehicleTelemetryPanel vehicleId={profile.id} />
        {shareControls}{ride.mode==='gps' && !precise && <Button title={t("Retry GPS")} icon="locate-outline" secondary onPress={ride.retryGPS} />}
        {navigationOptions.developerMode && navigationOptions.motion && motion.status !== 'Off' && <Text style={{ color: panelP.muted, fontSize: 12 }}>Motion: {motion.status} · {motion.acceleration.toFixed(2)} g · {motion.rotation.toFixed(2)} rad/s</Text>}
        {g?.offRoute && <Button title={t("End ride & replan")} secondary onPress={() => { ride.stop(); setGpsStart(true); setStart('Current location'); setStartPoint(undefined); setPlanner(true); }} />}
        <Text style={{ color: panelP.muted, fontSize: 12 }}>DIRECTION VOLUME</Text><View style={{ flexDirection: 'row', gap: 6 }}>{(['loud', 'quiet', 'off'] as const).map(volume => <View key={volume} style={{ flex: 1 }}><Button title={t(volume === 'loud' ? 'Loud' : volume === 'quiet' ? 'Quiet' : 'Off')} icon={volume === 'off' ? 'volume-mute-outline' : volume === 'quiet' ? 'volume-low-outline' : 'volume-high-outline'} secondary={navigationOptions.volume !== volume} onPress={() => updateNavigationOptions({ volume })} /></View>)}</View>{!navigationOptions.voice && <Text style={{ color: panelP.muted }}>Spoken directions are off in Settings.</Text>}{!!recorder.error && <Text accessibilityRole="alert" style={{ color: '#D75451' }}>{publicError(recorder.error,navigationOptions.developerMode)}</Text>}<Text style={{ color: panelP.muted, fontSize: 11 }}>{navigationOptions.recordRides ? 'Ride recording on · saved locally to Library' : 'Ride recording off'}</Text>{!!activity.status && Platform.OS==='ios' && <Text style={{color:panelP.muted,fontSize:12}}>{publicError(activity.status,navigationOptions.developerMode)}</Text>}<Button title={t("End ride")} icon="stop-circle-outline" onPress={ride.stop} />
      </View> : <>
        <VehicleSelector outlined />
        {routes.length === 0 && <View style={[styles.card, { backgroundColor: panelP.card }]}><Text style={{ color: panelP.text, fontSize: 18, fontWeight: '700' }}>Where will you ride?</Text><Text style={{color:panelP.muted,lineHeight:22}}>Choose a destination to compare routes, or record a trip without one.</Text></View>}
        {routes.map(r => { const e = estimate(r, profile), chosen = r.id === selected?.id; return <Pressable {...motionProps('route')} accessibilityRole="button" accessibilityLabel={t(`${r.name}, ${minutes(e.seconds)}`)} accessibilityState={{ selected: chosen,disabled:busy }} disabled={busy} key={r.id} onPress={() => { select(r); void Haptics.selectionAsync(); }} style={[styles.card, { backgroundColor: panelP.card, borderWidth: 2, borderColor: chosen ? panelP.accent : 'transparent',opacity:busy?.4:1 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={[s.round, { backgroundColor: panelP.bg }]}><Ionicons name={r.kind === 'bike' ? 'bicycle' : r.kind === 'car' ? 'car-outline' : 'trail-sign-outline'} size={24} color={panelP.accent} /></View><View style={{ flex: 1 }}><Text style={{ color: panelP.text, fontSize: 17, fontWeight: '700' }}>{r.name}</Text><Text style={{ color: panelP.muted, marginTop: 3 }}>{distanceLeft(e.meters, navigationOptions.unit)} · {r.source === 'gpx' ? 'Track only' : 'Access unverified'}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={{ color: panelP.text, fontSize: 25, fontWeight: '800' }}>{minutes(e.seconds)}</Text><Text style={{ color: panelP.muted, fontSize: 11 }}>minimum {minutes(e.minimumSeconds)}</Text></View></View>
          <Text style={{ color: panelP.muted, fontSize: 12 }}>{routeEnergyLabel(r, profile)}</Text>
          {r.source !== 'gpx' && r.plannedCap !== Math.min(profile.maxSpeed, profile.ridingLimit) && <Text style={{ color: '#C75A36', fontSize: 12 }}>Speed settings changed. Replan to update road speeds, alternatives and ETA.</Text>}
        </Pressable>; })}
        {selected?.warnings.map(w => <Text key={w} style={{ color: panelP.muted, fontSize: 12, lineHeight: 18 }}>{w}</Text>)}
        {error !== '' && <Text accessibilityRole="alert" style={{ color: '#C75A36', lineHeight: 20 }}>{publicError(error,navigationOptions.developerMode)}</Text>}
        <Text style={{ color: panelP.muted, fontSize: 12 }}>{departure ? scheduleSummary(departure, eta?.seconds, scheduleMode) : 'Depart now'} · ETA excludes traffic.{profile.learnedSpeedKmh ? ` Learned from ${profile.learnedRideCount} rides · ${displaySpeed(profile.learnedSpeedKmh, navigationOptions.unit).toFixed(1)} ${navigationOptions.unit === 'mi' ? 'mph' : 'km/h'} overall pace.` : ''}</Text>
        {(!selected || busy) && <Button title={t("Plan bicycle & car routes")} loading={busy} disabled={locating} icon="search" onPress={openPlanner} />}
        {!selected && !endPoint && !end.trim() && <Button title={t("Record trip")} secondary icon="recording-outline" disabled={vehicleLocked || busy} onPress={()=>router.push('/offline/record-trip')} />}
        {selected && <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button title={t("Start ride")} icon="navigate" disabled={!ready || busy} onPress={() => beginRide()} /></View><IconButton label={t("Share route")} icon="share-outline" disabled={busy} onPress={shareRoute} /></View>}

      </>}
      {!!notice && <Text style={{ color: panelP.accent }}>{publicError(notice,navigationOptions.developerMode)}</Text>}
      {!!recorder.error && !active && <Text accessibilityRole="alert" style={{ color: '#D75451' }}>{publicError(recorder.error,navigationOptions.developerMode)}</Text>}
      {selected && <View style={{ gap: 10 }}>{active && <Button title={t(overview ? 'Return to navigation' : 'Show full route · 15 seconds')} secondary icon="expand-outline" onPress={overview ? resumeFollowing : showOverview} />}{selected && <Button title={t("Clear ride & start new")} secondary icon="refresh" disabled={busy} onPress={clearRide} />}</View>}

      {selected?.source === 'gpx' && !active && <><Button title={t("Compare routes between track endpoints")} secondary onPress={() => { manualStart(); const a = selected.coordinates[0], b = selected.coordinates.at(-1)!; setStartPoint(a); setEndPoint(b); setStart(`${a[1]}, ${a[0]}`); setEnd(`${b[1]}, ${b[0]}`); setPlanner(true); }} /><Text style={{ color: panelP.muted, fontSize: 11 }}>Creates new road routes between the endpoints. It does not preserve or upload the original GPX track.</Text></>}

      {selected && selected.steps.length > 0 && !active && <View style={[styles.card, { backgroundColor: panelP.card }]}><Text style={{ fontWeight: '700', color: panelP.text }}>Turn-by-turn directions</Text>{selected.steps.map((step,i)=><TurnDirection key={`${i}-${step.index}`} text={step.text} sign={step.sign} meters={step.distance} unit={navigationOptions.unit} />)}</View>}
    </ScrollView>}
    </PaletteProvider>}</GlassSurface>}
    </NativeTabSafeOverlay>
    <ActionMenu title={t("Share route")} actions={actions} onClose={()=>setActions(null)} />
    <Modal visible={turnList && active} transparent animationType="slide" onRequestClose={()=>setTurnList(false)}><View style={{flex:1,padding:12,paddingTop:insets.top+12,backgroundColor:'#00000050'}}><Pressable accessibilityLabel={t("Dismiss upcoming directions")} onPress={()=>setTurnList(false)} style={StyleSheet.absoluteFill} /><View style={{maxHeight:'80%',width:'100%',maxWidth:560,alignSelf:wide?'flex-start':'center',backgroundColor:p.bg,borderRadius:24,overflow:'hidden'}}><SwipeArea onSwipe={open=>{if(open)setTurnList(false);}}><View style={{padding:16,flexDirection:'row',alignItems:'center',gap:12}}><Text style={{flex:1,color:p.text,fontSize:22,fontWeight:'800'}}>Upcoming directions</Text><IconButton label={t("Close directions")} icon="close" onPress={()=>setTurnList(false)} /></View></SwipeArea><ScrollView contentContainerStyle={{padding:10,gap:8}}>{selected?.steps.filter(step=>!g?.next || step.index >= g.next.index).map((step,i)=><View key={`${i}-${step.index}`} style={{backgroundColor:p.card,borderRadius:20}}><TurnDirection unit={navigationOptions.unit} sign={step.sign} text={step.text} meters={Math.max(0,(cumulative(selected.coordinates)[step.index] || 0)-(g?.along || 0))} /></View>)}</ScrollView></View></View></Modal>
    {externalJourney && <ExternalMapsWarning journey={externalJourney} onCancel={() => { setExternalJourney(null); setPlanner(true); }} />}
    <RouteWarning key={warningRoute?.id ?? 'closed'} route={warningRoute} onCancel={() => {reroutePending.current=null;setWarningRoute(null);}} onConfirm={route => {if(reroutePending.current===route){if(!activeRef.current){reroutePending.current=null;setWarningRoute(null);return;}setRoutes([route]);select(route);reroutePending.current=null;setWarningRoute(null);return;} if (route.id === selected?.id) { setWarningRoute(null); beginRide(warningSimulation.current, true); } }} />

  </SafeAreaView>}</TripSharing>;
}
const s = StyleSheet.create({ header: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' }, brandCard: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, boxShadow: '0 3px 16px #00000020' }, floatingPanel: { position: 'absolute', borderRadius: 26, overflow: 'hidden', boxShadow: '0 8px 32px #00000030' }, brand: { fontSize: 26, letterSpacing: -1.3, fontWeight: '800' }, round: { height: 46, width: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, mapBadge: { position: 'absolute', right: 16, top: 16, padding: 10, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }, recenter: { position: 'absolute', right: 12, top: 70, borderRadius: 14, padding: 12 }, metrics: { flexDirection: 'row', paddingVertical: 10 } });
