import { routeLayers, ROUTE_WIDTH } from '../core/routeLayers';
import { useCameraTarget } from '../services/useCameraTarget';
import React, { useEffect, useRef, useState } from 'react';
import { Map, Camera, GeoJSONSource, Layer, CameraRef, MapRef, RasterSource, Marker } from '@maplibre/maplibre-react-native';
import { Coord, Route } from '../core/types';
import { routeBounds } from '../core/geo';
import { serverUrl } from '../services/api';
import PositionArrow from './PositionArrow';
import { mapStyle } from './mapConfig';
export interface MapProps { offlineStyle?: string; transit?: boolean; completedMeters?: number; overview?: boolean; onPan?(): void; routes: Route[]; selected: Route | null; position?: Coord; follow?: boolean; heading?: number; navigating?: boolean; followPadding?: MapProps['fitPadding']; tilted?: boolean; overviewRequest?: number; onPick?(p: Coord): void; traffic?: boolean; startPoint?: Coord; endPoint?: Coord; fitPadding?: { top: number; bottom: number; left: number; right: number }; }
export default function RideMap({ routes, selected, position, follow, onPick, traffic, startPoint, endPoint, fitPadding, heading = 0, navigating = false, followPadding, tilted = false, overviewRequest = 0, overview = false, onPan, completedMeters, offlineStyle, transit }: MapProps) {
  const camera = useRef<CameraRef>(null);
  const map = useRef<MapRef>(null);
  const [ready, setReady] = useState(false);
  const hasPosition = !!position;
  const cameraTarget = useCameraTarget(position, heading, !!follow && ready, JSON.stringify([tilted, followPadding || fitPadding]));
  useEffect(() => { let cancelled = false; if (ready && !selected && (!follow || !hasPosition)) void map.current?.getCenter().then(center => { if (!cancelled) camera.current?.easeTo({ center, pitch: tilted ? 50 : 0, duration: 350 }); }).catch(() => {}); return () => { cancelled = true; }; }, [ready, tilted, selected, follow, hasPosition]);
  useEffect(() => { if (selected && !follow && (!navigating || overview)) camera.current?.fitBounds(routeBounds(selected.coordinates), { padding: fitPadding || { top: 40, bottom: 40, left: 40, right: 40 }, duration: 500, bearing: 0, pitch: tilted ? 50 : 0 }); }, [selected, follow, fitPadding, overviewRequest, overview, navigating, tilted]);
  useEffect(() => { if (!selected && startPoint && !follow) { if (endPoint) camera.current?.fitBounds(routeBounds([startPoint, endPoint]), { padding: fitPadding, duration: 400, bearing: 0, pitch: tilted ? 50 : 0 }); else camera.current?.easeTo({ center: startPoint, zoom: 13, padding: fitPadding, bearing: 0, pitch: tilted ? 50 : 0, duration: 400 }); } }, [selected, startPoint, endPoint, follow, fitPadding, tilted]);
  useEffect(() => {
    if (follow && cameraTarget) camera.current?.easeTo({ center: cameraTarget.position, zoom: navigating ? 16.5 : 15, bearing: cameraTarget.heading, pitch: tilted ? 50 : 0, padding: followPadding || fitPadding, duration: cameraTarget.duration });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraTarget]);
  return <Map ref={map} onDidFinishLoadingMap={() => setReady(true)} onRegionWillChange={e => { if (e.nativeEvent.userInteraction) onPan?.(); }} style={{ flex: 1 }} mapStyle={offlineStyle || mapStyle} touchRotate={!follow} attributionPosition={{ top: 130, right: 16 }} logoPosition={{ top: 170, right: 16 }} onPress={e => onPick?.(e.nativeEvent.lngLat)}>
    <Camera ref={camera} initialViewState={{ bounds: selected ? routeBounds(selected.coordinates) : [12.50, 41.84, 12.61, 41.89], padding: { top: 40, bottom: 40, left: 40, right: 40 } }} />
    {ready && transit && !offlineStyle && mapStyle.includes('openfreemap.org') && <Layer id="velunivo-transit" source="openmaptiles" source-layer="transportation" type="line" filter={['match',['get','class'],['rail','transit'],true,false]} paint={{'line-color':'#A478E8','line-width':3,'line-opacity':.85}} />}
    {traffic && serverUrl && <RasterSource id="traffic" tiles={[`${serverUrl}/traffic/{z}/{x}/{y}.png`]} tileSize={256}><Layer type="raster" paint={{ 'raster-opacity': .7 }} /></RasterSource>}
    {routeLayers(routes, selected, completedMeters).map(r => <GeoJSONSource key={r.id} id={r.id} data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: r.coordinates } }}><Layer id={`${r.id}-outline`} type="line" paint={{ 'line-color': r.outline, 'line-width': ROUTE_WIDTH + 3 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} /><Layer id={`${r.id}-line`} type="line" paint={{ 'line-color': r.color, 'line-width': ROUTE_WIDTH }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} /></GeoJSONSource>)}
    {selected && <GeoJSONSource id="endpoints" data={{ type: 'FeatureCollection', features: [selected.coordinates[0], selected.coordinates.at(-1)!].map((p, i) => ({ type: 'Feature' as const, properties: { end: i }, geometry: { type: 'Point' as const, coordinates: p } })) }}><Layer type="circle" paint={{ 'circle-radius': 7, 'circle-color': '#007F6D', 'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF' }} /></GeoJSONSource>}
    {(startPoint || endPoint) && <GeoJSONSource id="planning" data={{ type: 'FeatureCollection', features: [startPoint, endPoint].filter((p): p is Coord => !!p).map(p => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: p } })) }}><Layer type="circle" paint={{ 'circle-radius': 7, 'circle-color': '#007F6D', 'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF' }} /></GeoJSONSource>}
    {position && <Marker id="navigation-position" lngLat={position}><PositionArrow navigating={navigating} rotation={follow ? 0 : heading} /></Marker>}
  </Map>;
}
