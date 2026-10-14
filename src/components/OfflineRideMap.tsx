import {transitPaint} from '../core/transitLines';
import {scratchBorders} from '../core/scratchBorders';
import {useScratchViewport} from '../services/useScratchViewport';
import {useScratchLayer} from '../services/useScratchLayer';
import GroupPin from './GroupPin';
import {MapAreaSelection} from '../core/mapArea';
import {useMapArea} from '../services/useMapArea';
import {View} from 'react-native';
import Text from './LocalizedText';
import {t} from '../i18n/core';
import { routeLayers, ROUTE_WIDTH } from '../core/routeLayers';
import { useCameraTarget } from '../services/useCameraTarget';
import React, { useEffect, useRef, useState } from 'react';
import { Map, Camera, GeoJSONSource, Layer, CameraRef, MapRef, RasterSource, Marker } from '@maplibre/maplibre-react-native';
import { Coord, Route } from '../core/types';
import { routeBounds } from '../core/geo';
import { serverUrl } from '../services/api';
import PositionArrow from './PositionArrow';
import { mapStyle } from './mapConfig';
export interface MapProps {bookmarks?:import('../core/recordings').RideBookmark[];mapBounds?:[number,number,number,number];scratchContext?:import('../services/useScratchLayer').ScratchContext;scratchHighlight?:string[];onScratchTile?(id:string):void;groupRiders?:import('../groups/model').GroupMember[]; areaSelection?:MapAreaSelection; offlineStyle?: string; transit?: boolean; trace?: Coord[][]; completedMeters?: number; overview?: boolean; onPan?(): void; routes: Route[]; selected: Route | null; position?: Coord; positionLabel?:string; follow?: boolean; heading?: number; navigating?: boolean; followPadding?: MapProps['fitPadding']; tilted?: boolean; overviewRequest?: number; onPick?(p: Coord,resolution?:number): void; traffic?: boolean; startPoint?: Coord; endPoint?: Coord; planningStops?:import('../core/itinerary').RouteStop[]; fitPadding?: { top: number; bottom: number; left: number; right: number }; }
export default function RideMap({ routes, selected, position, follow, onPick, traffic, startPoint, endPoint, fitPadding, heading = 0, navigating = false, followPadding, tilted = false, overviewRequest = 0, overview = false, onPan, trace, completedMeters, offlineStyle, transit, positionLabel, planningStops, areaSelection,groupRiders=[],bookmarks=[],scratchContext,scratchHighlight,onScratchTile,mapBounds }: MapProps) {
  const {bounds:scratchBounds,update:setScratchBounds}=useScratchViewport(),scratch=useScratchLayer(scratchContext,scratchBounds,scratchHighlight);
  const camera = useRef<CameraRef>(null);
  const map = useRef<MapRef>(null);
  const [ready, setReady] = useState(false);
  const reportArea=useMapArea(areaSelection,ready,async(x,y)=>{if(!map.current)throw new Error('Map unavailable');return map.current.unproject([x,y]);});
  useEffect(()=>{if(mapBounds&&ready)camera.current?.fitBounds(mapBounds,{padding:{top:120,bottom:120,left:60,right:60},duration:400});},[mapBounds,ready]);
  const hasPosition = !!position;
  const cameraTarget = useCameraTarget(position, heading, !!follow && ready, JSON.stringify([tilted, followPadding || fitPadding]));
  const previousTilt=useRef(tilted);
  useEffect(() => { const changed=previousTilt.current!==tilted;previousTilt.current=tilted;let cancelled = false; if ((!navigating||changed) && ready && !mapBounds && !selected && (!follow || !hasPosition)) void map.current?.getCenter().then(center => { if (!cancelled) camera.current?.easeTo({ center, pitch: tilted ? 50 : 0, duration: 350 }); }).catch(() => {}); return () => { cancelled = true; }; }, [ready, tilted, selected, follow, hasPosition,mapBounds,navigating]);
  useEffect(() => { if (selected && !follow && (!navigating || overview)) camera.current?.fitBounds(routeBounds(selected.coordinates), { padding: fitPadding || { top: 40, bottom: 40, left: 40, right: 40 }, duration: 500, bearing: 0, pitch: tilted ? 50 : 0 }); }, [selected, follow, fitPadding, overviewRequest, overview, navigating, tilted]);
  useEffect(() => { if (!selected && startPoint && !follow) { if (endPoint) camera.current?.fitBounds(routeBounds([startPoint, endPoint]), { padding: fitPadding, duration: 400, bearing: 0, pitch: tilted ? 50 : 0 }); else camera.current?.easeTo({ center: startPoint, zoom: scratchContext==='viewer'?16:13, padding: fitPadding, bearing: 0, pitch: tilted ? 50 : 0, duration: 400 }); } }, [selected, startPoint, endPoint, follow, fitPadding, tilted,scratchContext]);
  useEffect(() => {
    if (follow && cameraTarget) camera.current?.easeTo({ center: cameraTarget.position, zoom: navigating ? 16.5 : 15, bearing: cameraTarget.heading, pitch: tilted ? 50 : 0, padding: followPadding || fitPadding, duration: cameraTarget.duration });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraTarget]);
  return <Map onRegionIsChanging={e=>{if(scratchContext)setScratchBounds(e.nativeEvent.bounds);if(e.nativeEvent.userInteraction)onPan?.();}} onLayout={()=>{if(scratchContext)void map.current?.getBounds().then(setScratchBounds).catch(()=>{});}} onRegionDidChange={e=>{if(e.nativeEvent.userInteraction)onPan?.();reportArea();if(scratchContext)void map.current?.getBounds().then(b=>setScratchBounds(b)).catch(()=>{});}} ref={map} onDidFinishLoadingMap={() => setReady(true)} onRegionWillChange={e => { if (e.nativeEvent.userInteraction) onPan?.(); }} style={{ flex: 1 }} mapStyle={offlineStyle || mapStyle} touchRotate={!follow&&!areaSelection} touchPitch={!areaSelection} attributionPosition={{ top: 130, right: 16 }} logoPosition={{ top: 170, right: 16 }} onPress={e => onPick?.(e.nativeEvent.lngLat,scratch.geometry.resolution)}>
    <Camera ref={camera} initialViewState={{ bounds: selected ? routeBounds(selected.coordinates) : [12.50, 41.84, 12.61, 41.89], padding: { top: 40, bottom: 40, left: 40, right: 40 } }} />
    {!!scratch.geometry.features.length&&<GeoJSONSource id="scratch-map" data={scratch.geometry} onPress={onScratchTile?e=>{const id=e.nativeEvent.features[0]?.properties?.cell;if(typeof id==='string')onScratchTile(id);}:undefined}><Layer id="scratch-fill" type="fill" paint={{'fill-color':['case',['get','highlight'],'#64DCC5','#007F6D'],'fill-opacity':['*',['get','opacity'],scratch.opacity]}}/></GeoJSONSource>}
    {!!scratch.geometry.features.length&&<GeoJSONSource id="scratch-boundaries" data={scratchBorders(scratch.geometry)}><Layer id="scratch-border" type="line" paint={{'line-color':'#79EBD1','line-width':2.4,'line-opacity':1}}/></GeoJSONSource>}
    {ready && transit && !offlineStyle && mapStyle.includes('openfreemap.org') && <Layer beforeId={routeLayers(routes,selected,completedMeters,trace)[0]?.id ? `${routeLayers(routes,selected,completedMeters,trace)[0].id}-outline` : undefined} id="velunivo-transit" source="openmaptiles" source-layer="transportation" type="line" filter={['match',['get','class'],['rail','transit'],true,false]} paint={transitPaint} />}
    {traffic && serverUrl && <RasterSource id="traffic" tiles={[`${serverUrl}/traffic/{z}/{x}/{y}.png`]} tileSize={256}><Layer id="velunivo-traffic" beforeId={routeLayers(routes,selected,completedMeters,trace)[0]?.id ? `${routeLayers(routes,selected,completedMeters,trace)[0].id}-outline` : undefined} type="raster" paint={{ 'raster-opacity': .7 }} /></RasterSource>}
    {routeLayers(routes, selected, completedMeters, trace).map(r => <GeoJSONSource key={r.id} id={r.id} data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: r.coordinates } }}><Layer id={`${r.id}-outline`} type="line" paint={{ 'line-color': r.outline, 'line-width': ROUTE_WIDTH + 3 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} /><Layer id={`${r.id}-line`} type="line" paint={{ 'line-color': r.color, 'line-width': ROUTE_WIDTH }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} /></GeoJSONSource>)}
    {selected && <GeoJSONSource id="endpoints" data={{ type: 'FeatureCollection', features: [selected.coordinates[0], selected.coordinates.at(-1)!].map((p, i) => ({ type: 'Feature' as const, properties: { end: i }, geometry: { type: 'Point' as const, coordinates: p } })) }}><Layer type="circle" paint={{ 'circle-radius': 7, 'circle-color': '#007F6D', 'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF' }} /></GeoJSONSource>}
    {!!bookmarks.length&&<GeoJSONSource id="ride-bookmarks" data={{type:'FeatureCollection',features:bookmarks.map(b=>({type:'Feature' as const,properties:{name:b.name},geometry:{type:'Point' as const,coordinates:b.coordinate}}))}}><Layer type="circle" paint={{'circle-radius':8,'circle-color':'#007F6D','circle-stroke-width':2,'circle-stroke-color':'#FFFFFF'}}/></GeoJSONSource>}
    {(startPoint || endPoint) && <GeoJSONSource id="planning" data={{ type: 'FeatureCollection', features: [startPoint, endPoint].filter((p): p is Coord => !!p).map(p => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: p } })) }}><Layer type="circle" paint={{ 'circle-radius': 7, 'circle-color': '#007F6D', 'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF' }} /></GeoJSONSource>}
    {(planningStops??selected?.waypoints??[]).filter(s=>s.coordinate.every(Number.isFinite)).map((stop,i)=><Marker key={`stop-${i}`} id={`stop-${i}`} lngLat={stop.coordinate} accessibilityLabel={`${t(`Stop ${i+1}`)} · ${stop.label}`}><View style={{width:30,height:30,alignItems:'center',justifyContent:'center',backgroundColor:'#007F6D',borderWidth:3,borderColor:'#FFFFFF',borderRadius:15}}><Text style={{color:'#FFFFFF',fontWeight:'800'}}>{i+1}</Text></View></Marker>)}
    {groupRiders.filter(r=>r.position).map(r=><Marker key={r.id} id={`group-${r.id}`} lngLat={r.position!} anchor="bottom" accessibilityLabel={r.name}><GroupPin rider={r} interactive={navigating}/></Marker>)}
    {position && <Marker id="navigation-position" lngLat={position} accessibilityLabel={t(positionLabel || 'Current position')}><PositionArrow navigating={navigating} rotation={follow ? 0 : heading} /></Marker>}
  </Map>;
}
