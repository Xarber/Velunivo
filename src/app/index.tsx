import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Alert, Platform, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { motionProps, useReducedMotion } from '../components/WebMotion';
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
import { forwardHeading, freshFix, distanceLeft, displaySpeed } from '../core/rideView';
import VehicleSelector from '../components/VehicleSelector';
import { batteryLabel } from '../core/vehicles';
import ScheduleControl from '../components/ScheduleControl';
import { scheduleSummary } from '../core/schedule';
import EndpointPicker from '../components/EndpointPicker';
import { Button, styles, usePalette, PaletteProvider } from '../components/ui';
import { useStore } from '../services/store';
import { serverUrl, fetchRoute } from '../services/api';
import { pickTrack, shareTrack } from '../services/files';
import { useRide } from '../services/useRide';
import { useMotion } from '../services/useSensors';
import { parseCoordinate } from '../core/geo';
import { estimate, minutes } from '../core/eta';
import { Coord, Route } from '../core/types';
function Awake() { useKeepAwake(); return null; }
function notify(text: string) { if (Platform.OS === 'web') window.alert(text); else Alert.alert('Velunivo', text); }
export default function Explore() {
  const p = usePalette(), { height, width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const wide = width >= 700, insets = useSafeAreaInsets();
  const [panelOpen, setPanelOpen] = useState(false);
  const [externalJourney, setExternalJourney] = useState<ExternalNavigation | null>(null);
  const [warningRoute, setWarningRoute] = useState<Route | null>(null);
  const [mapHeight, setMapHeight] = useState(height);
  const [overlayHeight, setOverlayHeight] = useState(height);
  const glassTabs = usesLiquidGlassTabs();
  const controlsHeight = glassTabs ? Math.min(mapHeight, overlayHeight) : mapHeight;
  const bottomObstruction = glassTabs ? Math.max(0, mapHeight - controlsHeight) : 0;
  const panelHeight = panelOpen ? Math.max(180, controlsHeight * .78) : 176;

  const [trafficAvailable, setTrafficAvailable] = useState(false), [traffic, setTraffic] = useState(false);
  const [departure, setDeparture] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'depart' | 'arrive'>('depart');
  useEffect(() => { if (serverUrl) fetch(`${serverUrl}/health`).then(r => r.json()).then(r => setTrafficAvailable(!!r.trafficConfigured)).catch(() => {}); }, []);
  const { routes, selected, select, setRoutes, profile, save, ready, lockVehicle, navigationOptions, updateNavigationOptions } = useStore();
  const [planner, setPlanner] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [start, setStart] = useState('Current location'), [end, setEnd] = useState('');
  const [startPoint, setStartPoint] = useState<Coord | undefined>(), [endPoint, setEndPoint] = useState<Coord | undefined>();
  const [gpsStart, setGpsStart] = useState(true), [locating, setLocating] = useState(false), [optionsOpen, setOptionsOpen] = useState(false);
  const [overview, setOverview] = useState(false), [overviewRequest, setOverviewRequest] = useState(0);
  const locationRequest = useRef(0), planRequest = useRef(0);
  const overviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [now, setNow] = useState(Date.now());
  const [offlineMap, setOfflineMap] = useState(false);
  const [picking, setPicking] = useState<'start' | 'end' | null>(null), [follow, setFollow] = useState(true);
  const ride = useRide(selected, profile, navigationOptions.unit), motion = useMotion(profile.motion && ride.mode === 'gps');
  const active = ride.mode !== 'idle', g = ride.progress;
  const expandedPanel = panelOpen || (wide && !active);
  const panelP = expandedPanel ? { ...p, dark: true, bg: '#071118', card: '#15222C', text: '#F6FAFC', muted: '#ADBCC6', line: '#30434B', accent: '#64DCC5' } : p;
  const live = useLocation(ride.mode !== 'gps');
  const mapFix = active ? ride.fix : live.fix;
  const mapPosition = mapFix && mapFix.accuracy <= 100 && now - mapFix.timestamp <= 15000 ? mapFix.coordinate : undefined;
  const visibleRoutes = useMemo(() => active && selected ? [selected] : routes, [active, selected, routes]);
  const compactHeight = active ? 180 : 176, visiblePanelHeight = panelOpen ? panelHeight : compactHeight;
  const compass = useHeading(ride.mode !== 'simulation' && navigationOptions.compass && !!mapPosition);
  const direction = forwardHeading(selected, g?.index, freshFix(mapFix, now) ? mapFix : null);
  const compassFresh = compass.heading !== null;
  const heading = compassFresh ? compass.heading! : direction.heading;
  const headingSource = ride.mode === 'simulation' ? 'Demo travel direction' : compassFresh ? compass.status : direction.source;
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
  const run = async (task: () => Promise<unknown>) => { try { await task(); } catch (e) { notify(e instanceof Error ? e.message : String(e)); } };
  async function plan() {
    const request = ++planRequest.current; setError(''); setExternalJourney(null); setBusy(true);
    try {
      let a: Coord, b: Coord;
      if (gpsStart) a = await resolveCurrentLocation();
      else { try { a = startPoint || parseCoordinate(start); } catch { throw new Error('Search your start address and choose a result, or pick your start on the map.'); } }
      try { b = endPoint || parseCoordinate(end); } catch { throw new Error('Search your destination and choose a result, or pick it on the map.'); }
      const results = await Promise.allSettled([fetchRoute(a, b, 'bike', profile), fetchRoute(a, b, 'car', profile)]);
      if (request !== planRequest.current) return;
      const good: Route[] = [], failures: string[] = [];
      results.forEach((r, i) => r.status === 'fulfilled' ? good.push(r.value) : failures.push(`${i === 0 ? 'Bicycle' : 'Car-road'}: ${r.reason.message}`));
      if (good.length) { setRoutes(good); select(good[0]); setPlanner(false); }
      else { setExternalJourney({ start: a, end: b, errors: failures }); setPlanner(false); }
      setError(failures.join('\n'));
    } catch (e) { if (request === planRequest.current) setError(e instanceof Error ? e.message : String(e)); }
    finally { if (request === planRequest.current) setBusy(false); }
  }
  async function resolveCurrentLocation() {
    const request = ++locationRequest.current;
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
  function picked(c: Coord) { if (!picking) return; const label = `${c[1].toFixed(6)}, ${c[0].toFixed(6)}`; if (picking === 'start') { manualStart(); setStart(label); setStartPoint(c); } else { setEnd(label); setEndPoint(c); } setPicking(null); setPlanner(true); }
  function cancelPendingLocation() { locationRequest.current++; setLocating(false); }
  function manualStart() { cancelPendingLocation(); setGpsStart(false); }
  function beginRide(simulate = false, confirmed = false) { if (!simulate && !confirmed && selected?.safetyWarnings?.length) { setWarningRoute(selected); return; } setNow(Date.now()); setPanelOpen(false); resumeFollowing(); ride.start(simulate); }
  function openPlanner() {
    setPlanner(true);
    if (gpsStart && !locating) { setLocating(true); const pending = resolveCurrentLocation(), request = locationRequest.current; void pending.catch(e => { if (request === locationRequest.current) setError(e.message); }).finally(() => { if (request === locationRequest.current) setLocating(false); }); }
  }
  function showOverview() {
    if (overviewTimer.current) clearTimeout(overviewTimer.current);
    setPanelOpen(false); setOverview(true); setOverviewRequest(n => n + 1);
    overviewTimer.current = setTimeout(() => { setOverview(false); overviewTimer.current = null; }, 15000);
  }
  function resumeFollowing() { if (overviewTimer.current) clearTimeout(overviewTimer.current); overviewTimer.current = null; setOverview(false); setFollow(true); }
  function clearRide() {
    setExternalJourney(null); setWarningRoute(null); planRequest.current++; setBusy(false); locationRequest.current++; setLocating(false); ride.stop(); setRoutes([]); select(null); setStart('Current location'); setStartPoint(undefined); setGpsStart(true); setEnd(''); setEndPoint(undefined); setDeparture(''); setScheduleMode('depart'); setOptionsOpen(false); setTraffic(false); setPicking(null); setPlanner(false); setPanelOpen(false); setError(''); resumeFollowing();
  }
  return <SafeAreaView edges={[]} onLayout={e => setMapHeight(e.nativeEvent.layout.height)} style={{ flex: 1, backgroundColor: p.bg }}>
    {active && <Awake />}
    <View style={StyleSheet.absoluteFill}>
      <RideMap routes={visibleRoutes} selected={selected} position={mapPosition} follow={follow && !overview && (active || (!selected && !startPoint && !picking))} onPan={() => setFollow(false)} heading={heading} tilted={navigationOptions.tilted && !overview} overviewRequest={overviewRequest} overview={overview} onPick={picked} traffic={traffic} startPoint={startPoint} endPoint={endPoint} offlineMap={offlineMap} fitPadding={fitPadding} followPadding={followPadding} navigating={active} />
      {!active && <View pointerEvents="none" style={[s.mapBadge, { backgroundColor: p.card, top: insets.top + (wide ? 24 : 82) }]}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.accent }} /><Text style={{ color: p.text, fontSize: 12, fontWeight: '700' }}>{picking ? `Tap your ${picking === 'start' ? 'start location' : 'destination'}` : selected?.source === 'gpx' ? 'GPX · TRACK PREVIEW' : !selected ? live.fix && !mapPosition ? 'Waiting for fresh GPS…' : live.status : 'ROUTE COMPARISON'}</Text></View>}
      {active && <><GlassSurface style={{ position: 'absolute', top: insets.top + 12, left: 12, right: wide ? undefined : 12, width: wide ? 420 : undefined, padding: 16, borderRadius: 24, backgroundColor: p.card, boxShadow: '0 4px 20px #00000030', flexDirection: 'row', gap: 14, alignItems: 'center' }}><Ionicons name={g?.next?.sign && g.next.sign < 0 ? 'arrow-back' : g?.next?.sign && g.next.sign > 0 && g.next.sign !== 4 ? 'arrow-forward' : 'arrow-up'} color={p.accent} size={40} /><View style={{ flex: 1 }}><Text style={{ color: p.accent, fontWeight: '800', fontSize: 24 }}>{g?.arrived ? 'Arrived' : g?.maneuverMeters !== undefined ? navigationOptions.unit === 'mi' ? `${Math.round(g.maneuverMeters * 3.28084 / 10) * 10} ft` : `${Math.round(g.maneuverMeters / 10) * 10} m` : 'Follow the route'}</Text><Text numberOfLines={2} style={{ color: p.text, fontSize: 17, fontWeight: '600' }}>{g?.offRoute ? 'Off route · stop safely to replan' : g?.next?.text || (selected?.source === 'gpx' ? 'GPX track · turns unavailable' : 'Turn instructions unavailable · follow the mapped route')}</Text><Text numberOfLines={1} style={{ color: p.muted, fontSize: 10, marginTop: 5 }}>{ride.mode === 'simulation' ? 'Simulation · no live GPS' : ride.status}</Text></View></GlassSurface><View style={{ position: 'absolute', left: 12, top: insets.top + 156 }}><SpeedBadges route={selected} profile={profile} fix={ride.fix} index={g?.index} offRoute={g?.offRoute} now={now} unit={navigationOptions.unit} simulation={ride.mode === 'simulation'} /></View></>}

      <GlassSurface interactive style={{ position: 'absolute', right: 12, top: insets.top + (active ? 162 : wide ? 110 : 170), borderRadius: 23, padding: 3, gap: 2, boxShadow: '0 3px 16px #00000020' }}>
        <PressMotion accessibilityRole="button" accessibilityLabel={overview ? 'Return to navigation' : !follow ? 'Follow current location' : Platform.OS === 'web' ? 'Follow travel direction' : navigationOptions.compass ? 'Use travel direction' : 'Use device compass'} accessibilityState={{ selected: navigationOptions.compass && follow }} onPress={() => { if (!follow || overview) resumeFollowing(); else if (Platform.OS !== 'web') updateNavigationOptions({ compass: !navigationOptions.compass }); }} style={s.mapControl}><Ionicons name={navigationOptions.compass && Platform.OS !== 'web' ? 'compass-outline' : 'navigate'} size={25} color="#287CF5" style={navigationOptions.compass && Platform.OS !== 'web' ? undefined : { transform: [{ rotate: '-45deg' }] }} /></PressMotion>
        <View style={{ height: 1, marginHorizontal: 9, backgroundColor: p.line }} />
        <PressMotion accessibilityRole="button" accessibilityLabel={navigationOptions.tilted ? 'Use flat map' : 'Use 3D tilted map'} accessibilityState={{ selected: navigationOptions.tilted }} onPress={() => updateNavigationOptions({ tilted: !navigationOptions.tilted })} style={s.mapControl}><Text style={{ color: '#287CF5', fontSize: 17, fontWeight: '800' }}>{navigationOptions.tilted ? '2D' : '3D'}</Text></PressMotion>
        {selected && <><View style={{ height: 1, marginHorizontal: 9, backgroundColor: p.line }} /><PressMotion accessibilityRole="button" accessibilityLabel={overview ? 'Return to navigation' : 'Show full route'} onPress={overview ? resumeFollowing : showOverview} style={s.mapControl}><Ionicons name={overview ? 'navigate-outline' : 'expand-outline'} size={23} color="#287CF5" /></PressMotion></>}
      </GlassSurface>

    </View>
    {!active && <View pointerEvents="box-none" style={[s.header, { top: insets.top + 12, left: 16, right: wide ? undefined : 16 }]}><GlassSurface style={s.brandCard}><Brand /></GlassSurface><Pressable accessibilityRole="button" accessibilityLabel="Plan a ride" disabled={active} onPress={openPlanner} style={[s.round, { backgroundColor: p.card }]}><Ionicons name="search" size={22} color={p.text} /></Pressable></View>}
    <NativeTabSafeOverlay onHeight={setOverlayHeight}>
      {picking && <View style={{ position: 'absolute', bottom: 12, left: 12 }}><Button title="Cancel map selection" secondary onPress={() => { setPicking(null); setPlanner(true); }} /></View>}
    {!picking && <GlassSurface expanded={expandedPanel} {...motionProps('sheet')} style={[s.floatingPanel, { backgroundColor: panelP.bg, left: 12, right: wide ? undefined : 12, width: wide ? 390 : undefined, top: wide && !active ? insets.top + 88 : undefined, bottom: 12, height: wide && !active ? undefined : active && panelOpen ? Math.min(controlsHeight * .6, 480) : visiblePanelHeight }]}>
      <PaletteProvider value={panelP}><SwipeArea onSwipe={setPanelOpen} style={{ paddingTop: 8 }}>
      <View style={{ alignItems: 'center', paddingBottom: 6 }}><View style={{ height: 4, width: 38, borderRadius: 2, backgroundColor: panelP.muted, opacity: .4 }} /></View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: panelP.text, fontWeight: '800', fontSize: 20 }}>{active ? 'Trip' : 'Your ride'}</Text>{(!wide || active) && <Pressable accessibilityRole="button" accessibilityLabel={panelOpen ? 'Collapse ride controls' : 'Expand ride controls'} onPress={() => setPanelOpen(v => !v)} style={{ padding: 8 }}><Ionicons name={panelOpen ? 'chevron-down' : 'chevron-up'} color={panelP.accent} size={22} /></Pressable>}</View>
      </SwipeArea>
      {(!wide || active) && !panelOpen ? <SwipeArea onSwipe={setPanelOpen}><MotionView {...motionProps('content')} style={{ paddingHorizontal: 16, gap: 10 }}>{active ? <RideDashboard etaOnly compact simulation={ride.mode === 'simulation'} profile={profile} route={selected} fix={ride.fix} index={g?.index} offRoute={g?.offRoute} seconds={eta?.seconds} meters={eta?.meters} now={now} unit={navigationOptions.unit} /> : <Text numberOfLines={1} style={{ color: panelP.muted }}>{selected && eta ? `${selected.name} · ${distanceLeft(eta.meters, navigationOptions.unit)} · ${minutes(eta.seconds)}` : 'Plan your next ride or import a GPX'}</Text>}<Button title={active ? 'Ride controls' : 'Plan a ride'} icon={active ? 'navigate' : 'search'} onPress={() => active ? setPanelOpen(true) : openPlanner()} /></MotionView></SwipeArea> : <ScrollView {...motionProps('content')} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 14, paddingBottom: 28 }}>
      {active ? <View style={[styles.card, { backgroundColor: panelP.card }]}>
        <RideDashboard etaOnly simulation={ride.mode === 'simulation'} profile={profile} route={selected} fix={ride.fix} index={g?.index} offRoute={g?.offRoute} seconds={eta?.seconds} meters={eta?.meters} now={now} unit={navigationOptions.unit} />
        <Text style={{ color: panelP.muted, fontSize: 12 }}>{profile.name} · Cap {displaySpeed(Math.min(profile.maxSpeed, profile.ridingLimit), navigationOptions.unit).toFixed(0)} {navigationOptions.unit === 'mi' ? 'mph' : 'km/h'} · {eta ? batteryLabel(eta.meters, profile) : 'Range unknown'}</Text>
        <Text style={{ color: panelP.muted, fontSize: 11 }}>{headingSource}{ride.mode === 'gps' && navigationOptions.compass && !compassFresh ? ` · ${compass.status}` : ''}{!precise ? ' · Waiting for a precise GPS fix' : ''}</Text>

        {motion.status !== 'Off' && <Text style={{ color: panelP.muted, fontSize: 12 }}>Motion: {motion.status} · {motion.acceleration.toFixed(2)} g · {motion.rotation.toFixed(2)} rad/s</Text>}
        {g?.offRoute && <Button title="End ride & replan" secondary onPress={() => { ride.stop(); if (ride.fix) { setStart(`${ride.fix.coordinate[1]}, ${ride.fix.coordinate[0]}`); setStartPoint(ride.fix.coordinate); manualStart(); } setPlanner(true); }} />}
        <Button title="End ride" onPress={ride.stop} />
      </View> : <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: panelP.text, fontSize: 23, fontWeight: '800' }}>Your next ride</Text><Text style={{ color: panelP.accent, fontSize: 12, fontWeight: '700' }}>{displaySpeed(Math.min(profile.maxSpeed, profile.ridingLimit), navigationOptions.unit).toFixed(0)} {navigationOptions.unit === 'mi' ? 'MPH' : 'KM/H'} CAP</Text></View>
        {routes.length === 0 && <View style={[styles.card, { backgroundColor: panelP.card }]}><Text style={{ color: panelP.text, fontSize: 18, fontWeight: '700' }}>Where will you ride?</Text><Text style={{ color: panelP.muted, lineHeight: 20 }}>Plan a route or import your own GPX to see riding estimates. Imported tracks are previews; road access and turns are not verified.</Text></View>}
        <VehicleSelector />
        {routes.map(r => { const e = estimate(r, profile), chosen = r.id === selected?.id; return <Pressable {...motionProps('route')} accessibilityRole="button" accessibilityLabel={`${r.name}, ${minutes(e.seconds)}`} accessibilityState={{ selected: chosen }} key={r.id} onPress={() => { select(r); void Haptics.selectionAsync(); }} style={[styles.card, { backgroundColor: panelP.card, borderWidth: 2, borderColor: chosen ? panelP.accent : 'transparent' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={[s.round, { backgroundColor: panelP.bg }]}><Ionicons name={r.kind === 'bike' ? 'bicycle' : r.kind === 'car' ? 'car-outline' : 'trail-sign-outline'} size={24} color={panelP.accent} /></View><View style={{ flex: 1 }}><Text style={{ color: panelP.text, fontSize: 17, fontWeight: '700' }}>{r.name}</Text><Text style={{ color: panelP.muted, marginTop: 3 }}>{distanceLeft(e.meters, navigationOptions.unit)} · {r.source === 'gpx' ? 'Track only' : 'Access unverified'}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={{ color: panelP.text, fontSize: 25, fontWeight: '800' }}>{minutes(e.seconds)}</Text><Text style={{ color: panelP.muted, fontSize: 11 }}>minimum {minutes(e.minimumSeconds)}</Text></View></View>
          <Text style={{ color: panelP.muted, fontSize: 12 }}>{batteryLabel(e.meters, profile)}</Text>
          {r.source !== 'gpx' && r.plannedCap !== Math.min(profile.maxSpeed, profile.ridingLimit) && <Text style={{ color: '#C75A36', fontSize: 12 }}>Speed settings changed. Replan to update road speeds, alternatives and ETA.</Text>}
        </Pressable>; })}
        {selected?.warnings.map(w => <Text key={w} style={{ color: panelP.muted, fontSize: 12, lineHeight: 18 }}>{w}</Text>)}
        {error !== '' && <Text accessibilityRole="alert" style={{ color: '#C75A36', lineHeight: 20 }}>{error}</Text>}
        <Text style={{ color: panelP.muted, fontSize: 12 }}>{departure ? scheduleSummary(departure, eta?.seconds, scheduleMode) : 'Depart now'} · ETA excludes traffic.</Text>
        <Button title={optionsOpen ? 'Hide ride options' : 'Ride options'} secondary icon="options-outline" onPress={() => setOptionsOpen(v => !v)} />
        {optionsOpen && <>        <View style={{ gap: 10 }}><View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button title="Depart at" secondary={scheduleMode !== 'depart'} onPress={() => setScheduleMode('depart')} /></View><View style={{ flex: 1 }}><Button title="Arrive by" secondary={scheduleMode !== 'arrive'} onPress={() => setScheduleMode('arrive')} /></View></View><ScheduleControl value={departure} onChange={setDeparture} /><Text style={{ color: panelP.muted, fontSize: 12 }}>{scheduleSummary(departure, eta?.seconds, scheduleMode)} · Estimated with your riding profile</Text><Text accessibilityRole="alert" style={{ color: '#C75A36', fontSize: 12, lineHeight: 18 }}>Scheduled trips do not use traffic conditions or traffic simulation. Allow extra time for delays.</Text><Button title={traffic ? 'Hide live traffic' : 'Show live traffic'} secondary disabled={!trafficAvailable} onPress={() => setTraffic(v => !v)} />{!trafficAvailable && <Text style={{ color: panelP.muted, fontSize: 12 }}>Live traffic needs a configured TomTom server key.</Text>}{traffic && <Text style={{ color: panelP.muted, fontSize: 12 }}>Current traffic flow · © TomTom · not included in scooter ETA</Text>}</View>
        </>}
        {Platform.OS === 'ios' && <Button title={offlineMap ? 'Use device maps' : 'Use downloadable maps'} secondary onPress={() => setOfflineMap(v => !v)} />}
        <Button title="Plan bicycle & car routes" icon="search" onPress={openPlanner} />
        {selected && <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button title="Start ride" icon="navigate" disabled={!ready} onPress={() => beginRide()} /></View><Button title="Simulate" secondary onPress={() => beginRide(true)} /></View>}
        <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button title="Import GPX" secondary icon="add" onPress={() => void run(async () => { const r = await pickTrack(); if (r) { setRoutes([r]); select(r); } })} /></View>{selected && <Button title="Save" secondary icon="bookmark-outline" onPress={() => void run(async () => { await save(selected); notify('Saved to your Library.'); })} />}</View>
      </>}
      <View style={{ gap: 10 }}>{selected && <Button title={overview ? 'Return to navigation' : 'Show full route · 15 seconds'} secondary icon="expand-outline" onPress={overview ? resumeFollowing : showOverview} />}{selected && <Button title="Clear ride & start new" secondary icon="refresh" onPress={clearRide} />}</View>
      {selected && !active && <Button title="Export route as GPX" secondary icon="share-outline" onPress={() => void run(() => shareTrack(selected.coordinates))} />}
      {selected?.source === 'gpx' && !active && <><Button title="Compare routes between track endpoints" secondary onPress={() => { manualStart(); const a = selected.coordinates[0], b = selected.coordinates.at(-1)!; setStartPoint(a); setEndPoint(b); setStart(`${a[1]}, ${a[0]}`); setEnd(`${b[1]}, ${b[0]}`); setPlanner(true); }} /><Text style={{ color: panelP.muted, fontSize: 11 }}>Creates new road routes between the endpoints. It does not preserve or upload the original GPX track.</Text></>}
      {ride.recording.length > 1 && !active && <Button title={`Export ride · ${ride.recording.length} fixes`} secondary icon="share-outline" onPress={() => void run(() => shareTrack(ride.recording))} />}
      {selected && selected.steps.length > 0 && !active && <View style={[styles.card, { backgroundColor: panelP.card }]}><Text style={{ fontWeight: '700', color: panelP.text }}>Turn-by-turn directions</Text>{selected.steps.map((step, i) => <Text key={`${i}-${step.index}`} style={{ color: panelP.muted, lineHeight: 20 }}>{i + 1}. {step.text}</Text>)}</View>}
    </ScrollView>}
    </PaletteProvider></GlassSurface>}
    </NativeTabSafeOverlay>
    {externalJourney && <ExternalMapsWarning journey={externalJourney} onCancel={() => { setExternalJourney(null); setPlanner(true); }} />}
    <RouteWarning key={warningRoute?.id ?? 'closed'} route={warningRoute} onCancel={() => setWarningRoute(null)} onConfirm={route => { if (route.id === selected?.id) { setWarningRoute(null); beginRide(false, true); } }} />
    <Modal visible={planner} animationType={reducedMotion ? 'none' : 'fade'} transparent presentationStyle="overFullScreen" onRequestClose={() => setPlanner(false)}><View style={{ flex: 1, justifyContent: 'center', padding: wide ? 24 : 12, backgroundColor: '#00000025' }}><Pressable accessibilityLabel="Dismiss route planner" onPress={() => setPlanner(false)} style={StyleSheet.absoluteFill} /><SafeAreaView {...motionProps('planner', planner ? 'open' : 'closed')} edges={['top', 'bottom']} style={{ width: '100%', maxWidth: 560, maxHeight: '92%', alignSelf: wide ? 'flex-start' : 'center', backgroundColor: p.bg, borderRadius: 28, overflow: 'hidden', boxShadow: '0 12px 36px #00000030' }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 18, width: '100%', maxWidth: 780, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={[styles.title, { color: p.text }]}>Where to?</Text><Pressable accessibilityLabel="Close planner" onPress={() => setPlanner(false)}><Ionicons name="close-circle" size={30} color={p.muted} /></Pressable></View>
      <Text style={[styles.subtitle, { color: p.muted }]}>Compare bicycle and car-road candidates at your riding speed. Search an address and select a result, use your location, or pick either endpoint on the map. Coordinates also work.</Text>
      <EndpointPicker disabled={busy} label="Start" value={start} onChange={v => { manualStart(); setStart(v); setStartPoint(undefined); }} onSelect={(label, c) => { manualStart(); setStart(label); setStartPoint(c); }} onLocation={() => void run(resolveCurrentLocation)} onMap={() => { cancelPendingLocation(); setPicking('start'); setPlanner(false); }} />
      <EndpointPicker disabled={busy} label="Destination" value={end} onChange={v => { setEnd(v); setEndPoint(undefined); }} onSelect={(label, c) => { setEnd(label); setEndPoint(c); }} onMap={() => { setPicking('end'); setPlanner(false); }} />
      <View style={[styles.card, { backgroundColor: p.card }]}><VehicleSelector disabled={busy} /><Text style={{ color: p.muted }}>Hardware {displaySpeed(profile.maxSpeed, navigationOptions.unit).toFixed(0)} {navigationOptions.unit === 'mi' ? 'mph' : 'km/h'} · Riding limit {displaySpeed(profile.ridingLimit, navigationOptions.unit).toFixed(0)} {navigationOptions.unit === 'mi' ? 'mph' : 'km/h'}</Text><Text style={{ color: p.muted, fontSize: 12 }}>Prefer routes avoiding motorways, trunk roads, steps, ferries and roads above 50 km/h. Flagged candidates require confirmation before riding. Scooter access needs review.</Text></View>
      {locating && <Text style={{ color: p.muted }}>Finding your current GPS location…</Text>}
      {busy && <ActivityIndicator color={p.accent} />}{!!error && <Text style={{ color: '#C75A36' }}>{error}</Text>}
      <Button title={busy ? 'Finding routes…' : 'Compare routes'} disabled={busy || locating} onPress={() => void plan()} />
    </ScrollView></SafeAreaView></View></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({ mapControl: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, header: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' }, brandCard: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, boxShadow: '0 3px 16px #00000020' }, floatingPanel: { position: 'absolute', borderRadius: 26, overflow: 'hidden', boxShadow: '0 8px 32px #00000030' }, brand: { fontSize: 26, letterSpacing: -1.3, fontWeight: '800' }, round: { height: 46, width: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, mapBadge: { position: 'absolute', right: 16, top: 16, padding: 10, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }, recenter: { position: 'absolute', right: 12, top: 70, borderRadius: 14, padding: 12 }, metrics: { flexDirection: 'row', paddingVertical: 10 } });
