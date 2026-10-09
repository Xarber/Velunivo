import React, { useEffect, useRef } from 'react';
import { Map, Camera, GeoJSONSource, Layer, CameraRef, RasterSource, Marker } from '@maplibre/maplibre-react-native';
import { Coord, Route } from '../core/types';
import { routeBounds } from '../core/geo';
import { serverUrl } from '../services/api';
import PositionArrow from './PositionArrow';
import { mapStyle } from './mapConfig';
export interface MapProps { routes: Route[]; selected: Route | null; position?: Coord; follow?: boolean; heading?: number; navigating?: boolean; followPadding?: MapProps['fitPadding']; tilted?: boolean; overviewRequest?: number; onPick?(p: Coord): void; traffic?: boolean; startPoint?: Coord; endPoint?: Coord; fitPadding?: { top: number; bottom: number; left: number; right: number }; }
export default function RideMap({ routes, selected, position, follow, onPick, traffic, startPoint, endPoint, fitPadding, heading = 0, navigating = false, followPadding, tilted = false, overviewRequest = 0 }: MapProps) {
  const camera = useRef<CameraRef>(null);
  useEffect(() => { if (selected && !follow) camera.current?.fitBounds(routeBounds(selected.coordinates), { padding: fitPadding || { top: 40, bottom: 40, left: 40, right: 40 }, duration: 500, bearing: 0, pitch: 0 }); }, [selected, follow, fitPadding, overviewRequest, tilted]);
  useEffect(() => { if (!selected && startPoint && !follow) { if (endPoint) camera.current?.fitBounds(routeBounds([startPoint, endPoint]), { padding: fitPadding, duration: 400, bearing: 0, pitch: 0 }); else camera.current?.easeTo({ center: startPoint, zoom: 13, padding: fitPadding, bearing: 0, pitch: 0, duration: 400 }); } }, [selected, startPoint, endPoint, follow, fitPadding]);
  useEffect(() => { if (position && follow) camera.current?.easeTo({ center: position, zoom: 16.5, bearing: heading, pitch: tilted ? 50 : 0, padding: followPadding || fitPadding, duration: 250 }); }, [position, follow, heading, tilted, fitPadding, followPadding]);
  return <Map style={{ flex: 1 }} mapStyle={mapStyle} touchRotate={!follow} attributionPosition={{ top: 130, right: 16 }} logoPosition={{ top: 170, right: 16 }} onPress={e => onPick?.(e.nativeEvent.lngLat)}>
    <Camera ref={camera} initialViewState={{ bounds: selected ? routeBounds(selected.coordinates) : [12.50, 41.84, 12.61, 41.89], padding: { top: 40, bottom: 40, left: 40, right: 40 } }} />
    {traffic && serverUrl && <RasterSource id="traffic" tiles={[`${serverUrl}/traffic/{z}/{x}/{y}.png`]} tileSize={256}><Layer type="raster" paint={{ 'raster-opacity': .7 }} /></RasterSource>}
    {routes.map(r => <GeoJSONSource key={r.id} id={r.id} data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: r.coordinates } }}><Layer id={`${r.id}-line`} type="line" paint={{ 'line-color': r.id === selected?.id ? '#007F6D' : '#658ACA', 'line-width': r.id === selected?.id ? 6 : 4, 'line-opacity': r.id === selected?.id ? 1 : .6 }} layout={{ 'line-cap': 'round', 'line-join': 'round' }} /></GeoJSONSource>)}
    {selected && <GeoJSONSource id="endpoints" data={{ type: 'FeatureCollection', features: [selected.coordinates[0], selected.coordinates.at(-1)!].map((p, i) => ({ type: 'Feature' as const, properties: { end: i }, geometry: { type: 'Point' as const, coordinates: p } })) }}><Layer type="circle" paint={{ 'circle-radius': 7, 'circle-color': '#007F6D', 'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF' }} /></GeoJSONSource>}
    {(startPoint || endPoint) && <GeoJSONSource id="planning" data={{ type: 'FeatureCollection', features: [startPoint, endPoint].filter((p): p is Coord => !!p).map(p => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates: p } })) }}><Layer type="circle" paint={{ 'circle-radius': 7, 'circle-color': '#007F6D', 'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF' }} /></GeoJSONSource>}
    {position && <Marker id="navigation-position" lngLat={position}><PositionArrow navigating={navigating} rotation={follow ? 0 : heading} /></Marker>}
  </Map>;
}
