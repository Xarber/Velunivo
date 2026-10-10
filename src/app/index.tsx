import { useNavigationActivity } from '../services/useNavigationActivity';
import { maneuverDistance, arrivalTime , forwardHeading, freshFix, distanceLeft, displaySpeed } from '../core/rideView';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Platform, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { motionProps, useReducedMotion } from '../components/WebMotion';
import TurnDirection from '../components/TurnDirection';
import ActionMenu, { MenuAction } from '../components/ActionMenu';
import { Journey, swapEndpoints } from '../core/places';
import { cumulative , parseCoordinate } from '../core/geo';
import RideMap from '../components/RideMap';
import SpeedBadges from '../components/SpeedBadges';
import PressMotion from '../components/PressMotion';
import MotionView from '../components/MotionView';
import SwipeArea from '../components/SwipeArea';
import NativeTabSafeOverlay, { usesLiquidGlassTabs } from '../components/NativeTabSafeOverlay';
import RouteWarning from '../components/RouteWarning';
import ExternalMapsWarning from '../components/ExternalMapsWarning';
import { ExternalNavigation } from '../core/externalMaps';
import GlassSurface from '../components/GlassSurface';
import { useLocation } from '../services/useLocation';
import Brand from '../components/Brand';
import RideDashboard from '../components/RideDashboard';
import { useHeading } from '../services/useHeading';
import VehicleSelector from '../components/VehicleSelector';
import { batteryLabel } from '../core/vehicles';
import ScheduleControl from '../components/ScheduleControl';
import { scheduleSummary } from '../core/schedule';
import EndpointPicker from '../components/EndpointPicker';
import { Button, IconButton, styles, usePalette, PaletteProvider } from '../components/ui';
import { useStore } from '../services/store';
import { serverUrl, fetchRoute } from '../services/api';
import { shareTrack } from '../services/files';
import { useRideRecorder } from '../services/useRideRecorder';
import { useDownloadedMaps } from '../services/useDownloadedMaps';
import { useRide } from '../services/useRide';
import { useMotion } from '../services/useSensors';
import { estimate, minutes } from '../core/eta';
import { Coord, Fix, Route } from '../core/types';
function Awake() { useKeepAwake(); return null; }
export default function Explore() {
  const p = usePalette(), { height, width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const wide = width >= 700, insets = useSafeAreaInsets();
  const [panelOpen, setPanelOpen] = useState(false);
  const [externalJourney, setExternalJourney] = useState<ExternalNavigation | null>(null);
  const warningSimulation = useRef(false);
  const [warningRoute, setWarningRoute] = useState<Route | null>(null);
  const [mapHeight, setMapHeight] = useState(height);
  const [overlayHeight, setOverlayHeight] = useState(height);
  const glassTabs = usesLiquidGlassTabs();
  const controlsHeight = glassTabs ? Math.min(mapHeight, overlayHeight) : mapHeight;
  const bottomObstruction = glassTabs ? Math.max(0, mapHeight - controlsHeight) : 0;
  const panelHeight = panelOpen ? Math.max(180, controlsHeight * .78) : 176;

  const [trafficAvailable, setTrafficAvailable] = useState(Platform.OS === 'ios');
  const [departure, setDeparture] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'depart' | 'arrive'>('depart');
  useEffect(() => { if (serverUrl) fetch(`${serverUrl}/health`).then(r => r.json()).then(r => setTrafficAvailable(!!r.trafficConfigured)).catch(() => {}); }, []);
  const { routes, selected, select, setRoutes, profile, save, ready, lockVehicle, navigationOptions, updateNavigationOptions, pendingJourney, requestJourney, addPlace } = useStore();
  const [actions, setActions] = useState<MenuAction[] | null>(null), [turnList, setTurnList] = useState(false), [previewPin, setPreviewPin] = useState<Coord | undefined>();
  const [notice, setNotice] = useState('');
  const [focusedEndpoint, setFocusedEndpoint] = useState<'start' | 'end' | null>(null);
  const [planner, setPlanner] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [start, setStart] = useState('Current location'), [end, setEnd] = useState('');
  const [startPoint, setStartPoint] = useState<Coord | undefined>(), [endPoint, setEndPoint] = useState<Coord | undefined>();
  const [gpsStart, setGpsStart] = useState(true), [locating, setLocating] = useState(false), [optionsOpen, setOptionsOpen] = useState(false);
  const [overview, setOverview] = useState(false), [overviewRequest, setOverviewRequest] = useState(0);
  const locationRequest = useRef(0), planRequest = useRef(0);
  const overviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [now, setNow] = useState(Date.now());
  const webLeft = Platform.OS === 'web' ? insets.left : 0, webRight = Platform.OS === 'web' ? insets.right : 0;
  const recordingAccept = useRef<(fix: Fix, arrived?: boolean) => void | Promise<void>>(() => {});
  const [picking, setPicking] = useState<'start' | 'end' | null>(null), [follow, setFollow] = useState(true);
  const ride = useRide(selected, profile, navigationOptions, (fix,arrived) => recordingAccept.current(fix,arrived)), motion = useMotion((navigationOptions.motion && ride.mode !== 'idle') || (navigationOptions.recordRides && ride.mode === 'gps'));
  const active = ride.mode !== 'idle', g = ride.progress;
  const expandedPanel = panelOpen || (wide && !active);
  const panelP = expandedPanel ? { ...p, dark: true, bg: '#071118', card: '#15222C', text: '#F6FAFC', muted: '#ADBCC6', line: '#30434B', accent: '#64DCC5' } : p;
  const live = useLocation(ride.mode === 'idle');
  const mapFix = active ? ride.fix : live.fix;
  const mapPosition = mapFix && mapFix.accuracy <= 100 && now - mapFix.timestamp <= 15000 ? mapFix.coordinate : undefined;
  const visibleRoutes = useMemo(() => active && selected ? [selected] : routes, [active, selected, routes]);
  const compactHeight = active ? 180 : 176, visiblePanelHeight = panelOpen ? panelHeight : compactHeight;
  const compass = useHeading((navigationOptions.compass || (navigationOptions.recordRides && ride.mode === 'gps')) && !!mapPosition);
  const direction = forwardHeading(selected, g?.index, freshFix(mapFix, now) ? mapFix : null);
  const recorder = useRideRecorder(ride.mode === 'gps', navigationOptions.recordRides, g?.arrived === true, selected, profile, motion, compass); useEffect(() => { recordingAccept.current = recorder.accept; }, [recorder.accept]);
  const offlineMap = useDownloadedMaps(navigationOptions.downloadedMaps, mapPosition, selected);
  const compassFresh = navigationOptions.compass && compass.heading !== null;
  const heading = compassFresh ? compass.heading! : direction.heading;
  const headingSource = compassFresh ? compass.status : ride.mode === 'simulation' ? 'Demo travel direction' : direction.source;
  const precise = freshFix(ride.fix, now);
  useEffect(() => { const clock = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(clock); }, []);
  useEffect(() => () => { if (overviewTimer.current) clearTimeout(overviewTimer.current); }, []);
  useEffect(() => { lockVehicle(active); return () => lockVehicle(false); }, [active, lockVehicle]);
  const fitPadding = useMemo(() => {
    if (picking) return { top: 100, bottom: 55 + bottomObstruction, left: 24, right: 24 };
    if (wide && !active) return { top: 90, bottom: 45 + bottomObstruction, left: 425, right: 60 };
    return { top: active ? 145 : 115, bottom: bottomObstruction + (active ? 205 : Math.min(visiblePanelHeight + 25, controlsHeight * .5)), left: 24, right: 70 };
  }, [wide, active, picking, visiblePanelHeight, controlsHeight, bottomObstruction]);
  const followPadding = useMemo(() => ({ ...fitPadding, top: fitPadding.top + Math.max(0, (mapHeight - fitPadding.top - fitPadding.bottom) * .42) }), [fitPadding, mapHeight]);
  const eta = selected ? estimate(selected, profile, active && g && !g.offRoute ? g.along : 0) : null;
  const activityProps = useMemo<import('../core/liveActivity').NavigationActivity>(()=>({turn:(ride.mode === 'simulation' ? 'Simulation · ' : '') + (g?.offRoute ? 'Off route · stop safely to replan' : g?.next?.text || 'Follow the route'),symbol:g?.next?.sign === 4 ? 'flag.fill' : g?.next?.sign && g.next.sign < 0 ? 'arrow.turn.up.left' : g?.next?.sign && g.next.sign > 0 ? 'arrow.turn.up.right' : 'arrow.up',distance:g?.maneuverMeters === undefined ? '—' : maneuverDistance(g.maneuverMeters,navigationOptions.unit),arrival:eta ? arrivalTime(eta.seconds,now) : '—',minutes:eta ? minutes(eta.seconds) : '—',remaining:eta ? distanceLeft(eta.meters,navigationOptions.unit) : '—'}),[g,eta,now,navigationOptions.unit,ride.mode]);
  const activity = useNavigationActivity(active && !g?.arrived && navigationOptions.liveActivities, activityProps);
  const run = async (task: () => Promise<unknown>) => { try { await task(); } catch (e) { setNotice(e instanceof Error ? e.message : String(e)); } };
  async function plan(journey?: Journey) {
    const request = ++planRequest.current; setError(''); setExternalJourney(null); setBusy(true);
    try {
      let a: Coord, b: Coord;
      if (journey) a = journey.startCurrent ? await resolveCurrentLocation() : journey.start;
      else if (gpsStart) a = await resolveCurrentLocation();
      else { try { a = startPoint || parseCoordinate(start); } catch { throw new Error('Search your start address and choose a result, or pick your start on the map.'); } }
      try { b = journey?.end || (end === 'Current location' ? await currentArrival() : endPoint || parseCoordinate(end)); } catch { throw new Error('Search your destination and choose a result, or pick it on the map.'); }
      const results = await Promise.allSettled([fetchRoute(a, b, 'bike', profile), fetchRoute(a, b, 'car', profile)]);
      if (request !== planRequest.current) return;
      const good: Route[] = [], failures: string[] = [];
      results.forEach((r, i) => r.status === 'fulfilled' ? good.push({ ...r.value, startLabel: journey?.startLabel || start, endLabel: journey?.endLabel || end }) : failures.push(`${i === 0 ? 'Bicycle' : 'Car-road'}: ${r.reason.message}`));
      if (good.length) { setPreviewPin(undefined); setRoutes(good); select(good[0]); setPlanner(false); }
      else { setExternalJourney({ start: a, end: b, errors: failures }); setPlanner(false); }
      setError(failures.join('\n'));
    } catch (e) { if (request === planRequest.current) setError(e instanceof Error ? e.message : String(e)); }
    finally { if (request === planRequest.current) setBusy(false); }
  }
  useEffect(() => { if (!pendingJourney || active) return; const j=pendingJourney; // Consume an external Library request to populate the existing planner.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestJourney(null); setStart(j.startLabel); setEnd(j.endLabel); setStartPoint(j.startCurrent ? undefined : j.start); setEndPoint(j.end); setGpsStart(!!j.startCurrent); setDeparture(''); setPreviewPin(undefined); void plan(j);
    // Explicit endpoints are carried by the queued journey, not render-time input state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingJourney, active]);
  function shareRoute() { if (!selected) return; const r=selected; setActions([{title:'Save to Library',icon:'bookmark-outline',onPress:()=>void run(async()=>{await save(r);setNotice('Saved to your Library.');})},{title:'Export GPX',icon:'share-outline',onPress:()=>void run(()=>shareTrack(r.coordinates))}]); }
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
  function picked(c: Coord) { if (!picking) return; const label = `${c[1].toFixed(6)}, ${c[0].toFixed(6)}`; if (picking === 'start') { manualStart(); setStart(label); setStartPoint(c); } else { setEnd(label); setEndPoint(c); } setPicking(null); setPlanner(true); }
  function cancelPendingLocation() { locationRequest.current++; setLocating(false); }
  function manualStart() { cancelPendingLocation(); setGpsStart(false); }
  function beginRide(simulate = false, confirmed = false) { if (!confirmed && selected?.safetyWarnings?.length) { warningSimulation.current = simulate; setWarningRoute(selected); return; } setNow(Date.now()); setPanelOpen(false); resumeFollowing(); ride.start(simulate); }
  function openPlanner() {
    setPreviewPin(undefined); setPlanner(true);
    if (gpsStart && !locating) { setLocating(true); const pending = resolveCurrentLocation(), request = locationRequest.current; void pending.catch(e => { if (request === locationRequest.current) setError(e.message); }).finally(() => { if (request === locationRequest.current) setLocating(false); }); }
  }
  function showOverview() {
    if (overviewTimer.current) clearTimeout(overviewTimer.current);
    setPanelOpen(false); setOverview(true); setOverviewRequest(n => n + 1);
    overviewTimer.current = setTimeout(() => { setOverview(false); overviewTimer.current = null; }, 15000);
  }
  function resumeFollowing() { if (overviewTimer.current) clearTimeout(overviewTimer.current); overviewTimer.current = null; setOverview(false); setFollow(true); }
  function clearRide() {
    setPreviewPin(undefined); setTurnList(false); setExternalJourney(null); setWarningRoute(null); planRequest.current++; setBusy(false); locationRequest.current++; setLocating(false); ride.stop(); setRoutes([]); select(null); setStart('Current location'); setStartPoint(undefined); setGpsStart(true); setEnd(''); setEndPoint(undefined); setDeparture(''); setScheduleMode('depart'); setOptionsOpen(false);  setPicking(null); setPlanner(false); setPanelOpen(false); setError(''); resumeFollowing();
  }
  return <SafeAreaView edges={[]} onLayout={e => setMapHeight(e.nativeEvent.layout.height)} style={{ flex: 1, backgroundColor: p.bg }}>
    {active && <Awake />}
    <View style={StyleSheet.absoluteFill}>
      <RideMap completedMeters={active ? ride.completedMeters : undefined} routes={previewPin ? [] : visibleRoutes} selected={previewPin ? null : selected} position={mapPosition} follow={follow && !overview && !previewPin && (active || (!selected && !startPoint && !picking))} onPan={() => setFollow(false)} heading={heading} tilted={navigationOptions.tilted && !overview} overviewRequest={overviewRequest} overview={overview} onPick={picked} transit={navigationOptions.transit} traffic={navigationOptions.traffic} startPoint={previewPin || startPoint} endPoint={previewPin ? undefined : endPoint} offlineMap={offlineMap} fitPadding={fitPadding} followPadding={followPadding} navigating={active} />
      {!active && <View pointerEvents="none" style={[s.mapBadge, { backgroundColor: p.card, top: insets.top + (wide ? 24 : 82) }]}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.accent }} /><Text style={{ color: p.text, fontSize: 12, fontWeight: '700' }}>{picking ? `Tap your ${picking === 'start' ? 'start location' : 'destination'}` : selected?.source === 'gpx' ? 'GPX · TRACK PREVIEW' : !selected ? live.fix && !mapPosition ? 'Waiting for fresh GPS…' : live.status : 'ROUTE COMPARISON'}</Text></View>}
      {active && <><GlassSurface style={{ position:'absolute',top:insets.top+12,left:12+webLeft,right:wide ? undefined : 12+webRight,width:wide ? 420 : undefined,borderRadius:24 }}><SwipeArea onSwipe={open=>setTurnList(!open)}><Pressable accessibilityRole="button" accessibilityLabel="Show upcoming directions" onPress={()=>setTurnList(true)}><TurnDirection unit={navigationOptions.unit} sign={g?.next?.sign} meters={g?.maneuverMeters} arrived={g?.arrived} text={g?.offRoute ? 'Off route · stop safely to replan' : g?.next?.text || (selected?.source === 'gpx' ? 'GPX track · turns unavailable' : 'Turn instructions unavailable · follow the mapped route')} status={ride.mode === 'simulation' ? 'Simulation · no live GPS' : ride.status} /></Pressable></SwipeArea></GlassSurface><View style={{ position: 'absolute', left: 12 + webLeft, top: insets.top + 156 }}><SpeedBadges route={selected} profile={profile} fix={ride.fix} index={g?.index} offRoute={g?.offRoute} now={now} unit={navigationOptions.unit} simulation={ride.mode === 'simulation'} /></View></>}

      <GlassSurface interactive style={{ position: 'absolute', right: 12 + webRight, top: insets.top + (active ? 162 : wide ? 110 : 170), borderRadius: 23, padding: 3, gap: 2, boxShadow: '0 3px 16px #00000020' }}>
        <PressMotion accessibilityRole="button" accessibilityLabel={overview ? 'Return to navigation' : !follow ? 'Follow current location' : Platform.OS === 'web' ? 'Follow travel direction' : navigationOptions.compass ? 'Use travel direction' : 'Use device compass'} accessibilityState={{ selected: navigationOptions.compass && follow }} onPress={() => { if (!follow || overview) resumeFollowing(); else if (Platform.OS !== 'web') updateNavigationOptions({ compass: !navigationOptions.compass }); }} style={s.mapControl}><Ionicons name={navigationOptions.compass && Platform.OS !== 'web' ? 'compass-outline' : 'navigate'} size={25} color="#287CF5" style={navigationOptions.compass && Platform.OS !== 'web' ? undefined : { transform: [{ rotate: '-45deg' }] }} /></PressMotion>
        <View style={{ height: 1, marginHorizontal: 9, backgroundColor: p.line }} />
        <PressMotion accessibilityRole="button" accessibilityLabel={navigationOptions.tilted ? 'Use flat map' : 'Use 3D tilted map'} accessibilityState={{ selected: navigationOptions.tilted }} onPress={() => updateNavigationOptions({ tilted: !navigationOptions.tilted })} style={s.mapControl}><Text style={{ color: '#287CF5', fontSize: 17, fontWeight: '800' }}>{navigationOptions.tilted ? '2D' : '3D'}</Text></PressMotion>
        {selected && active && <><View style={{ height: 1, marginHorizontal: 9, backgroundColor: p.line }} /><PressMotion accessibilityRole="button" accessibilityLabel={overview ? 'Return to navigation' : 'Show full route'} onPress={overview ? resumeFollowing : showOverview} style={s.mapControl}><Ionicons name={overview ? 'navigate-outline' : 'expand-outline'} size={23} color="#287CF5" /></PressMotion></>}
      </GlassSurface>

    </View>
    {!active && <View pointerEvents="box-none" style={[s.header, { top: insets.top + 12, left: 16 + webLeft, right: wide ? undefined : 16 + webRight }]}><GlassSurface style={s.brandCard}><Brand /></GlassSurface><Pressable accessibilityRole="button" accessibilityLabel="Plan a ride" disabled={active} onPress={openPlanner} style={[s.round, { backgroundColor: p.card }]}><Ionicons name="search" size={22} color={p.text} /></Pressable></View>}
    <NativeTabSafeOverlay onHeight={setOverlayHeight}>
      {previewPin && <View style={{position:'absolute',bottom:195,left:12}}><Button title="Back to Where to" icon="search" onPress={openPlanner} /></View>}
      {picking && <View style={{ position: 'absolute', bottom: 12, left: 12 }}><Button title="Cancel map selection" secondary onPress={() => { setPicking(null); setPlanner(true); }} /></View>}
    {!picking && <GlassSurface expanded={expandedPanel} {...motionProps('sheet')} style={[s.floatingPanel, { backgroundColor: panelP.bg, left: 12 + webLeft, right: wide ? undefined : 12 + webRight, width: wide ? 390 : undefined, top: wide && !active ? insets.top + 88 : undefined, bottom: 12, height: wide && !active ? undefined : active && panelOpen ? Math.min(controlsHeight * .6, 480) : visiblePanelHeight }]}>
      <PaletteProvider value={panelP}><SwipeArea onSwipe={setPanelOpen} style={{ paddingTop: 8 }}>
      <View style={{ alignItems: 'center', paddingBottom: 6 }}><View style={{ height: 4, width: 38, borderRadius: 2, backgroundColor: panelP.muted, opacity: .4 }} /></View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: panelP.text, fontWeight: '800', fontSize: 20 }}>{active ? 'Trip' : 'Your ride'}</Text>{(!wide || active) && <Pressable accessibilityRole="button" accessibilityLabel={panelOpen ? 'Collapse ride controls' : 'Expand ride controls'} onPress={() => setPanelOpen(v => !v)} style={{ padding: 8 }}><Ionicons name={panelOpen ? 'chevron-down' : 'chevron-up'} color={panelP.accent} size={22} /></Pressable>}</View>
      </SwipeArea>
      {(!wide || active) && !panelOpen ? <SwipeArea onSwipe={setPanelOpen}><MotionView {...motionProps('content')} style={{ paddingHorizontal: 16, gap: 10 }}>{active ? <RideDashboard etaOnly compact simulation={ride.mode === 'simulation'} profile={profile} route={selected} fix={ride.fix} index={g?.index} offRoute={g?.offRoute} seconds={eta?.seconds} meters={eta?.meters} now={now} unit={navigationOptions.unit} /> : <Text numberOfLines={1} style={{ color: panelP.muted }}>{selected && eta ? `${selected.name} · ${distanceLeft(eta.meters, navigationOptions.unit)} · ${minutes(eta.seconds)}` : 'Plan your next ride'}</Text>}<Button title={active ? 'Ride controls' : selected ? 'Start ride' : 'Plan a ride'} icon={active || selected ? 'navigate' : 'search'} onPress={() => active ? setPanelOpen(true) : selected ? beginRide() : openPlanner()} /></MotionView></SwipeArea> : <ScrollView {...motionProps('content')} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 14, paddingBottom: 28 }}>
      {active ? <View style={[styles.card, { backgroundColor: panelP.card }]}>
        <RideDashboard etaOnly simulation={ride.mode === 'simulation'} profile={profile} route={selected} fix={ride.fix} index={g?.index} offRoute={g?.offRoute} seconds={eta?.seconds} meters={eta?.meters} now={now} unit={navigationOptions.unit} />
        <Text style={{ color: panelP.muted, fontSize: 12 }}>{profile.name} · Cap {displaySpeed(Math.min(profile.maxSpeed, profile.ridingLimit), navigationOptions.unit).toFixed(0)} {navigationOptions.unit === 'mi' ? 'mph' : 'km/h'} · {eta ? batteryLabel(eta.meters, profile) : 'Range unknown'}</Text>
        <Text style={{ color: panelP.muted, fontSize: 11 }}>{headingSource}{active && navigationOptions.compass && !compassFresh ? ` · ${compass.status}` : ''}{!precise ? ' · Waiting for a precise GPS fix' : ''}</Text>

        {navigationOptions.motion && motion.status !== 'Off' && <Text style={{ color: panelP.muted, fontSize: 12 }}>Motion: {motion.status} · {motion.acceleration.toFixed(2)} g · {motion.rotation.toFixed(2)} rad/s</Text>}
        {g?.offRoute && <Button title="End ride & replan" secondary onPress={() => { ride.stop(); setGpsStart(true); setStart('Current location'); setStartPoint(undefined); setPlanner(true); }} />}
        <Text style={{ color: panelP.muted, fontSize: 12 }}>DIRECTION VOLUME</Text><View style={{ flexDirection: 'row', gap: 6 }}>{(['loud', 'quiet', 'off'] as const).map(volume => <View key={volume} style={{ flex: 1 }}><Button title={volume === 'loud' ? 'Loud' : volume === 'quiet' ? 'Quiet' : 'Off'} icon={volume === 'off' ? 'volume-mute-outline' : volume === 'quiet' ? 'volume-low-outline' : 'volume-high-outline'} secondary={navigationOptions.volume !== volume} onPress={() => updateNavigationOptions({ volume })} /></View>)}</View>{!navigationOptions.voice && <Text style={{ color: panelP.muted }}>Spoken directions are off in Settings.</Text>}{!!recorder.error && <Text accessibilityRole="alert" style={{ color: '#D75451' }}>{recorder.error}</Text>}<Text style={{ color: panelP.muted, fontSize: 11 }}>{navigationOptions.recordRides ? 'Ride recording on · saved locally to Library' : 'Ride recording off'}</Text>{!!activity.status && Platform.OS==='ios' && <Text style={{color:panelP.muted,fontSize:12}}>{activity.status}</Text>}<Button title="End ride" icon="stop-circle-outline" onPress={ride.stop} />
      </View> : <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: panelP.muted, fontSize: 12 }}>{profile.name}</Text><Text style={{ color: panelP.accent, fontSize: 12, fontWeight: '700' }}>{displaySpeed(Math.min(profile.maxSpeed, profile.ridingLimit), navigationOptions.unit).toFixed(0)} {navigationOptions.unit === 'mi' ? 'MPH' : 'KM/H'} CAP</Text></View>
        {routes.length === 0 && <View style={[styles.card, { backgroundColor: panelP.card }]}><Text style={{ color: panelP.text, fontSize: 18, fontWeight: '700' }}>Where will you ride?</Text><Text style={{ color: panelP.muted, lineHeight: 20 }}>Plan a route or import your own GPX in Library to see riding estimates. Imported tracks are previews; road access and turns are not verified.</Text></View>}
        {routes.map(r => { const e = estimate(r, profile), chosen = r.id === selected?.id; return <Pressable {...motionProps('route')} accessibilityRole="button" accessibilityLabel={`${r.name}, ${minutes(e.seconds)}`} accessibilityState={{ selected: chosen }} key={r.id} onPress={() => { select(r); void Haptics.selectionAsync(); }} style={[styles.card, { backgroundColor: panelP.card, borderWidth: 2, borderColor: chosen ? panelP.accent : 'transparent' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={[s.round, { backgroundColor: panelP.bg }]}><Ionicons name={r.kind === 'bike' ? 'bicycle' : r.kind === 'car' ? 'car-outline' : 'trail-sign-outline'} size={24} color={panelP.accent} /></View><View style={{ flex: 1 }}><Text style={{ color: panelP.text, fontSize: 17, fontWeight: '700' }}>{r.name}</Text><Text style={{ color: panelP.muted, marginTop: 3 }}>{distanceLeft(e.meters, navigationOptions.unit)} · {r.source === 'gpx' ? 'Track only' : 'Access unverified'}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={{ color: panelP.text, fontSize: 25, fontWeight: '800' }}>{minutes(e.seconds)}</Text><Text style={{ color: panelP.muted, fontSize: 11 }}>minimum {minutes(e.minimumSeconds)}</Text></View></View>
          <Text style={{ color: panelP.muted, fontSize: 12 }}>{batteryLabel(e.meters, profile)}</Text>
          {r.source !== 'gpx' && r.plannedCap !== Math.min(profile.maxSpeed, profile.ridingLimit) && <Text style={{ color: '#C75A36', fontSize: 12 }}>Speed settings changed. Replan to update road speeds, alternatives and ETA.</Text>}
        </Pressable>; })}
        {selected?.warnings.map(w => <Text key={w} style={{ color: panelP.muted, fontSize: 12, lineHeight: 18 }}>{w}</Text>)}
        {error !== '' && <Text accessibilityRole="alert" style={{ color: '#C75A36', lineHeight: 20 }}>{error}</Text>}
        <Text style={{ color: panelP.muted, fontSize: 12 }}>{departure ? scheduleSummary(departure, eta?.seconds, scheduleMode) : 'Depart now'} · ETA excludes traffic.{profile.learnedSpeedKmh ? ` Learned from ${profile.learnedRideCount} rides · ${displaySpeed(profile.learnedSpeedKmh, navigationOptions.unit).toFixed(1)} ${navigationOptions.unit === 'mi' ? 'mph' : 'km/h'} overall pace.` : ''}</Text>
        {!selected && <Button title="Plan bicycle & car routes" icon="search" onPress={openPlanner} />}
        {selected && <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button title="Start ride" icon="navigate" disabled={!ready} onPress={() => beginRide()} /></View>{navigationOptions.developerMode && <IconButton label="Simulate ride" icon="play-outline" onPress={()=>beginRide(true)} />}<IconButton label="Share route" icon="share-outline" onPress={shareRoute} /></View>}

      </>}
      {!!notice && <Text style={{ color: panelP.accent }}>{notice}</Text>}
      {!!recorder.error && !active && <Text accessibilityRole="alert" style={{ color: '#D75451' }}>{recorder.error}</Text>}
      <View style={{ gap: 10 }}>{selected && active && <Button title={overview ? 'Return to navigation' : 'Show full route · 15 seconds'} secondary icon="expand-outline" onPress={overview ? resumeFollowing : showOverview} />}{selected && <Button title="Clear ride & start new" secondary icon="refresh" onPress={clearRide} />}</View>

      {selected?.source === 'gpx' && !active && <><Button title="Compare routes between track endpoints" secondary onPress={() => { manualStart(); const a = selected.coordinates[0], b = selected.coordinates.at(-1)!; setStartPoint(a); setEndPoint(b); setStart(`${a[1]}, ${a[0]}`); setEnd(`${b[1]}, ${b[0]}`); setPlanner(true); }} /><Text style={{ color: panelP.muted, fontSize: 11 }}>Creates new road routes between the endpoints. It does not preserve or upload the original GPX track.</Text></>}

      {selected && selected.steps.length > 0 && !active && <View style={[styles.card, { backgroundColor: panelP.card }]}><Text style={{ fontWeight: '700', color: panelP.text }}>Turn-by-turn directions</Text>{selected.steps.map((step,i)=><TurnDirection key={`${i}-${step.index}`} text={step.text} sign={step.sign} meters={step.distance} unit={navigationOptions.unit} />)}</View>}
    </ScrollView>}
    </PaletteProvider></GlassSurface>}
    </NativeTabSafeOverlay>
    <ActionMenu title="Share route" actions={actions} onClose={()=>setActions(null)} />
    <Modal visible={turnList && active} transparent animationType="slide" onRequestClose={()=>setTurnList(false)}><View style={{flex:1,padding:12,paddingTop:insets.top+12,backgroundColor:'#00000050'}}><Pressable accessibilityLabel="Dismiss upcoming directions" onPress={()=>setTurnList(false)} style={StyleSheet.absoluteFill} /><View style={{maxHeight:'80%',width:'100%',maxWidth:560,alignSelf:wide?'flex-start':'center',backgroundColor:p.bg,borderRadius:24,overflow:'hidden'}}><SwipeArea onSwipe={open=>{if(open)setTurnList(false);}}><View style={{padding:16,flexDirection:'row',alignItems:'center',gap:12}}><Text style={{flex:1,color:p.text,fontSize:22,fontWeight:'800'}}>Upcoming directions</Text><IconButton label="Close directions" icon="close" onPress={()=>setTurnList(false)} /></View></SwipeArea><ScrollView contentContainerStyle={{padding:10,gap:8}}>{selected?.steps.filter(step=>!g?.next || step.index >= g.next.index).map((step,i)=><View key={`${i}-${step.index}`} style={{backgroundColor:p.card,borderRadius:20}}><TurnDirection unit={navigationOptions.unit} sign={step.sign} text={step.text} meters={Math.max(0,(cumulative(selected.coordinates)[step.index] || 0)-(g?.along || 0))} /></View>)}</ScrollView></View></View></Modal>
    {externalJourney && <ExternalMapsWarning journey={externalJourney} onCancel={() => { setExternalJourney(null); setPlanner(true); }} />}
    <RouteWarning key={warningRoute?.id ?? 'closed'} route={warningRoute} onCancel={() => setWarningRoute(null)} onConfirm={route => { if (route.id === selected?.id) { setWarningRoute(null); beginRide(warningSimulation.current, true); } }} />
    <Modal visible={planner} animationType={reducedMotion ? 'none' : 'fade'} transparent presentationStyle="overFullScreen" onRequestClose={() => setPlanner(false)}><View style={{ flex: 1, justifyContent: 'center', padding: wide ? 24 : 12, backgroundColor: '#00000025' }}><Pressable accessibilityLabel="Dismiss route planner" onPress={() => setPlanner(false)} style={StyleSheet.absoluteFill} /><SafeAreaView {...motionProps('planner', planner ? 'open' : 'closed')} edges={['top', 'bottom']} style={{ width: '100%', maxWidth: 560, maxHeight: '92%', alignSelf: wide ? 'flex-start' : 'center', backgroundColor: p.bg, borderRadius: 28, overflow: 'hidden', boxShadow: '0 12px 36px #00000030' }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 18, width: '100%', maxWidth: 780, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={[styles.title, { color: p.text }]}>Where to?</Text><Pressable accessibilityLabel="Close planner" onPress={() => setPlanner(false)}><Ionicons name="close-circle" size={30} color={p.muted} /></Pressable></View>
      <Text style={[styles.subtitle, { color: p.muted }]}>Search an address or choose a point on the map. Compare bicycle and car-road routes at your riding speed.</Text>
      <EndpointPicker disabled={busy} label="Start" onFocus={() => setFocusedEndpoint('start')} showLocation={focusedEndpoint === 'start'} value={start} onChange={v => { manualStart(); setStart(v); setStartPoint(undefined); }} onSelect={(label, c) => { manualStart(); setStart(label); setStartPoint(c); }} onLocation={() => void run(resolveCurrentLocation)} onMap={() => { cancelPendingLocation(); setPicking('start'); setPlanner(false); }} />
      <View style={{ alignSelf: 'center' }}><IconButton label="Swap start and destination" icon="swap-vertical" disabled={busy || locating} onPress={() => { const swapped=swapEndpoints({label:start,point:startPoint,current:gpsStart},{label:end,point:endPoint,current:end === 'Current location'}); cancelPendingLocation(); setStart(swapped.start.label); setStartPoint(swapped.start.point); setGpsStart(!!swapped.start.current); setEnd(swapped.end.label); setEndPoint(swapped.end.point); }} /></View>
      <EndpointPicker disabled={busy} label="Destination" onFocus={() => setFocusedEndpoint('end')} showLocation={focusedEndpoint === 'end'} value={end} onChange={v => { setEnd(v); setEndPoint(undefined); }} onSelect={(label, c) => { setEnd(label); setEndPoint(c); }} onLocation={() => void run(async () => { const a = gpsStart, label = start, point = startPoint; const c = await resolveCurrentLocation(); setEnd('Current location'); setEndPoint(c); setStart(label); setStartPoint(point); setGpsStart(a); })} onMap={() => { setPicking('end'); setPlanner(false); }} />
      {(startPoint || endPoint) && <View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Button title="Show selected place on map" icon="map-outline" secondary onPress={()=>{setPreviewPin(focusedEndpoint === 'start' ? startPoint || endPoint : endPoint || startPoint);setFollow(false);setPlanner(false);}} /></View><IconButton label="Save selected place" icon="bookmark-outline" onPress={()=>{const c=focusedEndpoint === 'start' ? startPoint : endPoint;const label=focusedEndpoint === 'start' ? start : end;if(c){addPlace({name:label.split(',')[0],address:label,coordinate:c});setNotice('Saved place added.');}}} /></View>}
      <View style={[styles.card, { backgroundColor: p.card }]}><VehicleSelector disabled={busy} /></View>
      <View style={[styles.card, { backgroundColor: p.card }]}><Button title={departure ? scheduleSummary(departure, eta?.seconds, scheduleMode) : 'Depart now'} secondary icon="calendar-outline" onPress={() => setOptionsOpen(v => !v)} />{optionsOpen && <><View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button title="Depart at" icon="time-outline" secondary={scheduleMode !== 'depart'} onPress={() => setScheduleMode('depart')} /></View><View style={{ flex: 1 }}><Button title="Arrive by" icon="flag-outline" secondary={scheduleMode !== 'arrive'} onPress={() => setScheduleMode('arrive')} /></View></View><ScheduleControl value={departure} onChange={setDeparture} /><Text accessibilityRole="alert" style={{ color: '#C75A36', fontSize: 12 }}>Scheduled trips do not use traffic conditions or traffic simulation. Allow extra time for delays.</Text><Button title={navigationOptions.traffic ? 'Hide live traffic' : 'Show live traffic'} icon="car-outline" secondary disabled={!trafficAvailable} onPress={() => updateNavigationOptions({traffic:!navigationOptions.traffic})} />{!trafficAvailable && <Text style={{ color: p.muted, fontSize: 12 }}>Live traffic needs a configured TomTom server key. It is never included in ETA.</Text>}</>}</View>
      {locating && <Text style={{ color: p.muted }}>Finding your current GPS location…</Text>}
      {busy && <ActivityIndicator color={p.accent} />}{!!error && <Text style={{ color: '#C75A36' }}>{error}</Text>}
      <Button title={busy ? 'Finding routes…' : 'Compare routes'} disabled={busy || locating} onPress={() => void plan()} />
    </ScrollView></SafeAreaView></View></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({ mapControl: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, header: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' }, brandCard: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, boxShadow: '0 3px 16px #00000020' }, floatingPanel: { position: 'absolute', borderRadius: 26, overflow: 'hidden', boxShadow: '0 8px 32px #00000030' }, brand: { fontSize: 26, letterSpacing: -1.3, fontWeight: '800' }, round: { height: 46, width: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, mapBadge: { position: 'absolute', right: 16, top: 16, padding: 10, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }, recenter: { position: 'absolute', right: 12, top: 70, borderRadius: 14, padding: 12 }, metrics: { flexDirection: 'row', paddingVertical: 10 } });
