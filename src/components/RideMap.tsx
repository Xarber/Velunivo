import TransitOverlay from './TransitOverlay';
import {useTransitLines} from '../services/useTransitLines';
import {scratchBorders} from '../core/scratchBorders';
import {useScratchViewport} from '../services/useScratchViewport';
import BookmarkPin from './BookmarkPin';
import {useScratchLayer} from '../services/useScratchLayer';
import {useGroupRide} from '../groups/GroupProvider';
import GroupPin from './GroupPin';
import {useMapArea} from '../services/useMapArea';
import {t} from '../i18n/core';
import { routeLayers, ROUTE_WIDTH } from '../core/routeLayers';
import { useCameraTarget } from '../services/useCameraTarget';
import React, { useEffect, useRef, useState } from 'react';
import Text from './LocalizedText';
import { Platform,View } from 'react-native';
import MapView, { Marker, Polyline, Polygon } from 'react-native-maps';
import { Coord } from '../core/types';
import { routeBounds } from '../core/geo';
import PositionArrow from './PositionArrow';
import OfflineRideMap, { MapProps } from './OfflineRideMap';
const point = (p: Coord) => ({ longitude: p[0], latitude: p[1] });
export default function RideMap(props: MapProps & { offlineMap?: string }) {
  if (props.offlineMap || Platform.OS === 'android') return <OfflineRideMap {...props} offlineStyle={props.offlineMap} />;
  return <DeviceMap {...props} />;
}
function DeviceMap({ routes, selected, position, follow, onPick, traffic, startPoint, endPoint, fitPadding, heading = 0, navigating = false, followPadding, tilted = false, overviewRequest = 0, overview = false, onPan, trace, completedMeters, transit,positionLabel,planningStops,areaSelection,groupRiders=[],bookmarks=[],scratchContext,scratchHighlight,onScratchTile,mapBounds }: MapProps) {
  const group=useGroupRide(),{bounds:scratchBounds,update:setScratchBounds}=useScratchViewport(),scratch=useScratchLayer(scratchContext,scratchBounds,scratchHighlight);
  const transitLines=useTransitLines(!!transit,scratchBounds);
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false),[cameraBearing,setCameraBearing]=useState(0);
  const reportArea=useMapArea(areaSelection,ready,async(x,y)=>{if(!map.current)throw new Error('Map unavailable');const c=await map.current.coordinateForPoint({x,y});return [c.longitude,c.latitude];});
  const hasPosition = !!position;
  const cameraTarget = useCameraTarget(position, heading, !!follow && ready, JSON.stringify([tilted, followPadding || fitPadding]));
  const fit = () => { if(mapBounds){map.current?.fitToCoordinates([point([mapBounds[0],mapBounds[1]]),point([mapBounds[2],mapBounds[3]])],{edgePadding:{top:120,bottom:120,left:60,right:60},animated:true});return;} if (!selected && startPoint && !follow) { if (endPoint) map.current?.fitToCoordinates([startPoint, endPoint].map(point), { edgePadding: fitPadding || { top: 45, bottom: 45, left: 45, right: 45 }, animated: true }); else map.current?.animateCamera({ center: point(startPoint), zoom: scratchContext==='viewer'?16:13, heading: 0, pitch: 0 }, { duration: 400 }); } if (selected && !follow && (!navigating || overview)) { map.current?.setCamera({ heading: 0, pitch: 0 }); map.current?.fitToCoordinates(selected.coordinates.map(point), { edgePadding: fitPadding || { top: 45, bottom: 45, left: 45, right: 45 }, animated: true }); } };
  useEffect(() => { if (!navigating && !follow && tilted && !overview) { const timer = setTimeout(() => map.current?.animateCamera({ pitch: 50 }, { duration: 400 }), 550); return () => clearTimeout(timer); } }, [follow, tilted, overview, selected, ready,navigating]);
  const previousTilt=useRef(tilted);
  useEffect(() => { const changed=previousTilt.current!==tilted;previousTilt.current=tilted;if ((!navigating||changed) && ready && !mapBounds && !selected && (!follow || !hasPosition)) map.current?.animateCamera({ pitch: tilted ? 50 : 0 }, { duration: 350 }); }, [ready, tilted, selected, follow, hasPosition,mapBounds,navigating]);
  useEffect(fit, [mapBounds, selected, follow, fitPadding, overviewRequest, overview, navigating, tilted, startPoint, endPoint,scratchContext]);
  useEffect(() => {
    if (follow && cameraTarget) map.current?.animateCamera({ center: point(cameraTarget.position), zoom: navigating ? 16.5 : 15, altitude: navigating ? 650 : 1800, heading: cameraTarget.heading, pitch: tilted ? 50 : 0 }, { duration: cameraTarget.duration });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraTarget]);
  const [w, s, e, n] = selected ? routeBounds(selected.coordinates) : [9.18, 45.46, 9.20, 45.48];
  return <MapView onRegionChange={region=>{if(scratchContext||transit)setScratchBounds([region.longitude-region.longitudeDelta/2,region.latitude-region.latitudeDelta/2,region.longitude+region.longitudeDelta/2,region.latitude+region.latitudeDelta/2]);}} onLayout={()=>{if(scratchContext||transit)void map.current?.getMapBoundaries().then(b=>setScratchBounds([b.southWest.longitude,b.southWest.latitude,b.northEast.longitude,b.northEast.latitude])).catch(()=>{});}} onRegionChangeComplete={region=>{setScratchBounds([region.longitude-region.longitudeDelta/2,region.latitude-region.latitudeDelta/2,region.longitude+region.longitudeDelta/2,region.latitude+region.latitudeDelta/2]);reportArea();void map.current?.getCamera().then(c=>setCameraBearing(c.heading)).catch(()=>{});}} onPanDrag={onPan} onTouchStart={onPan} onTouchMove={onPan} onTouchEnd={onPan} ref={map} style={{ flex: 1 }} mapPadding={follow ? followPadding || fitPadding : { top: 0, bottom: 0, left: 0, right: 0 }} showsTraffic={traffic} mapType={transit ? 'standard' : 'mutedStandard'} showsPointsOfInterests showsBuildings pitchEnabled={!areaSelection} rotateEnabled={!follow&&!areaSelection} onMapReady={() => { setReady(true); fit(); }} legalLabelInsets={{ top: 120, left: 12, right: 12, bottom: fitPadding?.bottom || 45 }} initialRegion={{ latitude: (s + n) / 2, longitude: (w + e) / 2, latitudeDelta: Math.max(.005, (n - s) * 1.5), longitudeDelta: Math.max(.005, (e - w) * 1.5) }} onPress={ev => onPick?.([ev.nativeEvent.coordinate.longitude, ev.nativeEvent.coordinate.latitude],scratch.geometry.resolution)}>
    {transit&&<TransitOverlay data={transitLines}/> }
    {scratch.geometry.features.map(f=><Polygon key={`scratch-${f.id}`} coordinates={f.geometry.coordinates[0].map(point)} holes={f.geometry.coordinates.slice(1).map(r=>r.map(point))} fillColor={f.properties.highlight?'#64DCC566':`rgba(0,127,109,${f.properties.opacity*scratch.opacity})`} strokeColor="transparent" strokeWidth={0} tappable={!!onScratchTile} onPress={()=>onScratchTile?.(f.id)}/ >)}
    {scratchBorders(scratch.geometry).features.map(f=><Polyline key={f.id} coordinates={f.geometry.coordinates.map(point)} strokeColor="#79EBD1" strokeWidth={2.4} zIndex={20}/ >)}
    {/* Apple traffic uses the native road layer. A duplicate raster tile sits above MapKit polylines regardless of zIndex. */}
    {routeLayers(routes, selected, completedMeters, trace).flatMap((r,i) => [<Polyline key={`${r.id}-outline`} zIndex={100+i*2} coordinates={r.coordinates.map(point)} strokeColor={r.outline} strokeWidth={ROUTE_WIDTH + 3} />, <Polyline key={r.id} zIndex={101+i*2} coordinates={r.coordinates.map(point)} strokeColor={r.color} strokeWidth={ROUTE_WIDTH} />])}
    {(startPoint || selected?.coordinates[0]) && <Marker coordinate={point(startPoint || selected!.coordinates[0])} title={t("Start")} pinColor="#007F6D" />}
    {(endPoint || selected?.coordinates.at(-1)) && <Marker coordinate={point(endPoint || selected!.coordinates.at(-1)!)} title={t("Destination")} />}
    {(planningStops??selected?.waypoints??[]).filter(s=>s.coordinate.every(Number.isFinite)).map((stop,i)=><Marker key={`stop-${i}`} coordinate={point(stop.coordinate)} title={`${t(`Stop ${i+1}`)} · ${stop.label}`} zIndex={100}><View style={{width:30,height:30,alignItems:'center',justifyContent:'center',backgroundColor:'#007F6D',borderWidth:3,borderColor:'#FFFFFF',borderRadius:15}}><Text style={{color:'#FFFFFF',fontWeight:'800'}}>{i+1}</Text></View></Marker>)}
    {bookmarks.map(b=><Marker key={b.id} coordinate={point(b.coordinate)} title={b.name} zIndex={800} anchor={{x:.5,y:1}}><BookmarkPin/></Marker>)}
    {groupRiders.filter(r=>r.position).map(r=><Marker key={r.id} coordinate={point(r.position!)} title={r.name} onPress={e=>{e.stopPropagation();if(navigating)group.pinVideo(r.id);}} zIndex={900} anchor={{x:.5,y:1}}><GroupPin rider={r} interactive={false}/></Marker>)}
    {position && <Marker coordinate={point(position)} title={t(positionLabel || "Your position")} zIndex={1000} flat anchor={{ x: .5, y: .5 }}><PositionArrow navigating={navigating} rotation={heading-cameraBearing} /></Marker>}

  </MapView>;
}
