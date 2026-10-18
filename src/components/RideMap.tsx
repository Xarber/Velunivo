import {useInitialMapLocation} from '../services/initialMapLocation';
import {useMarkerOpacity} from '../services/useMarkerOpacity';
import {navigationArrowAssets} from './navigationArrowAssets';
import {useGhostRiders} from '../services/sampleData';
import {useDisplayCosmetics} from '../services/rewardTesting';
import {useStore} from '../services/store';
import {usePalette} from './ui';
import {nativeCoordinates} from '../core/nativeCoordinates';
import TransitOverlay from './TransitOverlay';
import {useTransitLines} from '../services/useTransitLines';
import {NativeScratchOverlay} from './ScratchOverlay';
import {useScratchViewport} from '../services/useScratchViewport';
import BookmarkPin from './BookmarkPin';
import {useScratchLayer} from '../services/useScratchLayer';
import {useGroupRide} from '../groups/GroupProvider';
import GroupPin from './GroupPin';
import {useMapArea} from '../services/useMapArea';
import {t} from '../i18n/core';
import { routeLayers, ROUTE_WIDTH } from '../core/routeLayers';
import { useCameraTarget } from '../services/useCameraTarget';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Text from './LocalizedText';
import { Animated,Platform,View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Coord } from '../core/types';
import { routeBounds } from '../core/geo';
import PositionArrow from './PositionArrow';
import OfflineRideMap, { MapProps } from './OfflineRideMap';
const point = (p: Coord) => ({ longitude: p[0], latitude: p[1] });
export default function RideMap(props: MapProps & { offlineMap?: string }) {
  if (props.offlineMap || Platform.OS === 'android') return <OfflineRideMap {...props} offlineStyle={props.offlineMap} />;
  return <DeviceMap {...props} />;
}
function DeviceMap({ routes, selected, position, follow, onPick, traffic, startPoint, endPoint, fitPadding, heading = 0, navigating = false, followPadding, tilted = false, overviewRequest = 0, overview = false, onPan, trace, completedMeters, transit,positionLabel,positionAt,planningStops,areaSelection,groupRiders=[],showGhosts=false,bookmarks=[],scratchContext,scratchHighlight,onScratchTile,mapBounds,scratchIndexOverride }: MapProps) {
 const initial=useInitialMapLocation(position);
 const positionOpacity=useMarkerOpacity(positionAt,undefined,positionLabel?.includes('Last known')?.45:1);
  const p=usePalette(),cosmetic=useDisplayCosmetics(useStore().navigationOptions);
  const ghosts=useGhostRiders(showGhosts?position??startPoint:undefined),allRiders=showGhosts?[...groupRiders,...ghosts]:groupRiders;
  const group=useGroupRide(),{bounds:scratchBounds,update:setScratchBounds}=useScratchViewport(),scratch=useScratchLayer(scratchContext,scratchBounds,scratchHighlight,scratchIndexOverride);
  const transitLines=useTransitLines(!!transit,scratchBounds);
  const map = useRef<MapView>(null);
  const positionMarker=useRef<React.ElementRef<typeof Marker>|null>(null);
  const [viewport,setViewport]=useState({width:0,height:0}),[ready, setReady] = useState(false),[rotation]=useState(()=>new Animated.Value(heading)),cameraBearing=useRef(0),headingRef=useRef(heading),samplingCamera=useRef(false),sampledAt=useRef(0);
  useEffect(()=>{headingRef.current=heading;rotation.setValue(heading-cameraBearing.current);},[heading,rotation]);
  const updateBearing=()=>{if(samplingCamera.current||Date.now()-sampledAt.current<60)return;samplingCamera.current=true;sampledAt.current=Date.now();void map.current?.getCamera().then(c=>{cameraBearing.current=c.heading;rotation.setValue(headingRef.current-c.heading);}).catch(()=>{}).finally(()=>{samplingCamera.current=false;});};
  const reportArea=useMapArea(areaSelection,ready,async(x,y)=>{if(!map.current)throw new Error('Map unavailable');const c=await map.current.coordinateForPoint({x,y});return [c.longitude,c.latitude];});
  const hasPosition = !!position;
  const cameraTarget = useCameraTarget(position, heading, !!follow && ready, JSON.stringify([tilted, followPadding || fitPadding,viewport.width,viewport.height]));
  const fit = () => { if(mapBounds){map.current?.fitToCoordinates([point([mapBounds[0],mapBounds[1]]),point([mapBounds[2],mapBounds[3]])],{edgePadding:fitPadding||{top:120,bottom:120,left:60,right:60},animated:true});return;} if (!selected && startPoint && !follow) { if (endPoint) map.current?.fitToCoordinates([startPoint, endPoint].map(point), { edgePadding: fitPadding || { top: 45, bottom: 45, left: 45, right: 45 }, animated: true }); else map.current?.animateCamera({ center: point(startPoint), zoom: scratchContext==='viewer'?16:13, heading: 0, pitch: 0 }, { duration: 400 }); } if (selected && !follow && (!navigating || overview)) { map.current?.setCamera({ heading: 0, pitch: 0 }); map.current?.fitToCoordinates(selected.coordinates.map(point), { edgePadding: fitPadding || { top: 45, bottom: 45, left: 45, right: 45 }, animated: true }); } };
  useEffect(() => { if (!navigating && !follow && tilted && !overview) { const timer = setTimeout(() => map.current?.animateCamera({ pitch: 50 }, { duration: 400 }), 550); return () => clearTimeout(timer); } }, [follow, tilted, overview, selected, ready,navigating]);
  const previousTilt=useRef(tilted);
  useEffect(() => { const changed=previousTilt.current!==tilted;previousTilt.current=tilted;if ((!navigating||changed) && ready && !mapBounds && !selected && (!follow || !hasPosition)) map.current?.animateCamera({ pitch: tilted ? 50 : 0 }, { duration: 350 }); }, [ready, tilted, selected, follow, hasPosition,mapBounds,navigating]);
  useEffect(fit, [mapBounds, selected, follow, fitPadding, overviewRequest, overview, navigating, tilted, startPoint, endPoint,scratchContext]);
  useEffect(() => {
    if (follow && cameraTarget) map.current?.animateCamera({ center: point(cameraTarget.position), zoom: navigating ? 16.5 : 15, altitude: navigating ? 650 : 1800, heading: cameraTarget.heading, pitch: tilted ? 50 : 0 }, { duration: cameraTarget.duration });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraTarget]);
  const [w, s, e, n] = useMemo(()=>selected ? routeBounds(selected.coordinates) : initial.coordinate?[initial.coordinate[0]-.01,initial.coordinate[1]-.01,initial.coordinate[0]+.01,initial.coordinate[1]+.01]:[-100,-50,100,50],[selected,initial.coordinate]);
  const paths=useMemo(()=>routeLayers(routes,selected,completedMeters,trace,p.accentDark),[routes,selected,completedMeters,trace,p.accentDark]);
  if(!initial.ready)return <View style={{flex:1,backgroundColor:p.bg}}/>;
  return <MapView onRegionChange={region=>{updateBearing();if(scratchContext||transit)setScratchBounds([region.longitude-region.longitudeDelta/2,region.latitude-region.latitudeDelta/2,region.longitude+region.longitudeDelta/2,region.latitude+region.latitudeDelta/2]);}} onLayout={event=>{const {width,height}=event.nativeEvent.layout;setViewport(old=>old.width===width&&old.height===height?old:{width,height});if(scratchContext||transit)void map.current?.getMapBoundaries().then(b=>setScratchBounds([b.southWest.longitude,b.southWest.latitude,b.northEast.longitude,b.northEast.latitude])).catch(()=>{});}} onRegionChangeComplete={region=>{setScratchBounds([region.longitude-region.longitudeDelta/2,region.latitude-region.latitudeDelta/2,region.longitude+region.longitudeDelta/2,region.latitude+region.latitudeDelta/2]);reportArea();updateBearing();}} onPanDrag={onPan} onTouchStart={onPan} onTouchMove={onPan} onTouchEnd={onPan} ref={map} style={{ flex: 1 }} mapPadding={follow ? followPadding || fitPadding : { top: 0, bottom: 0, left: 0, right: 0 }} showsCompass={false} showsTraffic={traffic} mapType={transit ? 'standard' : 'mutedStandard'} showsPointsOfInterests showsBuildings showsUserLocation={false} pitchEnabled={!areaSelection} rotateEnabled={!follow&&!areaSelection} onMapReady={() => { setReady(true); fit(); }} legalLabelInsets={{ top: 120, left: 12, right: 12, bottom: fitPadding?.bottom || 45 }} initialRegion={{ latitude: (s + n) / 2, longitude: (w + e) / 2, latitudeDelta: Math.max(.005, (n - s) * 1.5), longitudeDelta: Math.max(.005, (e - w) * 1.5) }} onPress={ev => onPick?.([ev.nativeEvent.coordinate.longitude, ev.nativeEvent.coordinate.latitude],scratch.geometry.resolution)}>
    {transit&&<TransitOverlay data={transitLines}/> }
    <NativeScratchOverlay geometry={scratch.geometry} opacity={scratch.opacity} loop={scratch.glowLoop} onPick={onScratchTile}/>
    {/* Apple traffic uses the native road layer. A duplicate raster tile sits above MapKit polylines regardless of zIndex. */}
    {paths.flatMap((r,i) => [<Polyline key={`${r.id}-outline`} zIndex={100+i*2} coordinates={nativeCoordinates(r.coordinates)} strokeColor={r.outline} strokeWidth={ROUTE_WIDTH + 3} />, <Polyline key={r.id} zIndex={101+i*2} coordinates={nativeCoordinates(r.coordinates)} strokeColor={r.color} strokeWidth={ROUTE_WIDTH} />])}
    {(startPoint || selected?.coordinates[0]) && <Marker coordinate={point(startPoint || selected!.coordinates[0])} title={t("Start")} pinColor={p.accentLight} />}
    {(endPoint || selected?.coordinates.at(-1)) && <Marker coordinate={point(endPoint || selected!.coordinates.at(-1)!)} title={t("Destination")} />}
    {(planningStops??selected?.waypoints??[]).filter(s=>s.coordinate.every(Number.isFinite)).map((stop,i)=><Marker key={`stop-${i}`} coordinate={point(stop.coordinate)} title={`${t(`Stop ${i+1}`)} · ${stop.label}`} zIndex={100}><View style={{width:30,height:30,alignItems:'center',justifyContent:'center',backgroundColor:p.accentLight,borderWidth:3,borderColor:'#FFFFFF',borderRadius:15}}><Text style={{color:'#FFFFFF',fontWeight:'800'}}>{i+1}</Text></View></Marker>)}
    {bookmarks.map(b=><Marker key={b.id} coordinate={point(b.coordinate)} title={b.name} zIndex={800} anchor={{x:.5,y:1}}><BookmarkPin/></Marker>)}
    {allRiders.filter(r=>r.position).map(r=><Marker key={r.id} coordinate={point(r.position!)} title={r.name} onPress={e=>{e.stopPropagation();if(navigating)group.pinVideo(r.id);}} zIndex={900} anchor={{x:.5,y:1}}><View collapsable={false} style={{width:66,height:70,alignItems:'center'}}><GroupPin rider={r} interactive={false}/></View></Marker>)}
    {position && <Marker ref={positionMarker} tracksViewChanges identifier={navigating?"velunivo-navigation":undefined} rotation={navigating?heading:0} key={String(navigating)+":"+cosmetic.navigationArrow+":"+cosmetic.locationPin} coordinate={point(position)} title={t(positionLabel || "Your position")} image={navigating?navigationArrowAssets[cosmetic.navigationArrow]:undefined} opacity={positionOpacity} zIndex={1000} anchor={{ x: .5, y: .5 }}>{!navigating&&<PositionArrow onReady={()=>positionMarker.current?.redraw()} navigating={false} rotation={rotation} />}</Marker>}

  </MapView>;
}
