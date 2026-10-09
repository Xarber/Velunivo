import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { View, Text } from 'react-native';
import { Route, Coord } from '../core/types';
import { routeBounds } from '../core/geo';
import { serverUrl } from '../services/api';
import { mapStyle } from './mapConfig';
interface MapProps { routes: Route[]; selected: Route | null; position?: Coord; follow?: boolean; heading?: number; navigating?: boolean; followPadding?: MapProps['fitPadding']; tilted?: boolean; overviewRequest?: number; onPick?(p: Coord): void; traffic?: boolean; startPoint?: Coord; endPoint?: Coord; offlineMap?: boolean; fitPadding?: { top: number; bottom: number; left: number; right: number }; }
export default function RideMap({ routes, selected, position, follow, onPick, traffic, startPoint, endPoint, fitPadding, heading = 0, navigating = false, followPadding, tilted = false, overviewRequest = 0 }: MapProps) {
  const div = useRef<HTMLDivElement>(null), map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false), [error, setError] = useState(false);
  const user = useRef<maplibregl.Marker | null>(null);
  const click = useRef(onPick);
  useEffect(() => { click.current = onPick; }, [onPick]);
  useEffect(() => {
    if (!div.current) return;
    try {
      maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
      const m = new maplibregl.Map({ container: div.current, style: mapStyle, center: [9.186, 45.468], zoom: 12, attributionControl: false }); map.current = m;
      m.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-right');
      m.addControl(new maplibregl.NavigationControl({ showZoom: false, showCompass: true, visualizePitch: true }), 'top-right');
      m.on('load', () => setLoaded(true)); m.on('error', () => setError(true));
      m.on('click', e => click.current?.([e.lngLat.lng, e.lngLat.lat]));
      const observer = new ResizeObserver(() => m.resize()); observer.observe(div.current);
      return () => { observer.disconnect(); user.current?.remove(); user.current = null; m.remove(); };
    } catch { queueMicrotask(() => setError(true)); }
  }, []);
  useEffect(() => { const m = map.current; if (!m || !loaded) return; if (follow) { m.dragRotate.disable(); m.touchZoomRotate.disableRotation(); m.keyboard.disableRotation(); } else { m.dragRotate.enable(); m.touchZoomRotate.enableRotation(); m.keyboard.enableRotation(); } }, [follow, loaded]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded) return;
    for (const layer of m.getStyle().layers ?? []) if (layer.id.startsWith('ride-')) { m.removeLayer(layer.id); if (m.getSource(layer.id)) m.removeSource(layer.id); }
    for (const r of routes) {
      const id = `ride-${r.id}`;
      m.addSource(id, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: r.coordinates } } });
      m.addLayer({ id, type: 'line', source: id, paint: { 'line-color': r.id === selected?.id ? '#007F6D' : '#658ACA', 'line-width': r.id === selected?.id ? 6 : 4 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
    }
    if (selected && !follow) { const [w, s, e, n] = routeBounds(selected.coordinates); m.jumpTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 } }); m.fitBounds([[w, s], [e, n]], { padding: fitPadding || 24, duration: 400, maxZoom: 17, bearing: 0, pitch: 0 }); }
  }, [routes, selected, loaded, follow, fitPadding, overviewRequest, tilted]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded) return;
    if (!position) { user.current?.remove(); user.current = null; return; }
    if (!user.current) { const element = document.createElement('div'); element.style.cssText = 'width:42px;height:42px;z-index:20;filter:drop-shadow(0 2px 4px #0005);pointer-events:none'; user.current = new maplibregl.Marker({ element, rotationAlignment: 'map', pitchAlignment: 'viewport' }).setLngLat(position).addTo(m); }
    const element = user.current.getElement(); element.setAttribute('aria-label', navigating ? 'Navigation position arrow' : 'Current position');
    element.innerHTML = navigating ? '<svg viewBox="0 0 40 40" width="42" height="42"><path d="M20 3L34 35L20 28L6 35Z" fill="#287CF5" stroke="white" stroke-width="3" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 40 40" width="42" height="42"><circle cx="20" cy="20" r="9" fill="#287CF5" stroke="white" stroke-width="3"/></svg>';
    user.current.setLngLat(position).setRotation(navigating ? heading : 0);
    if (follow) m.easeTo({ center: position, zoom: 16.5, bearing: heading, pitch: tilted ? 50 : 0, padding: followPadding || fitPadding, duration: 250 });
  }, [position, follow, loaded, heading, tilted, fitPadding, followPadding, navigating]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded || !serverUrl) return;
    if (traffic && !m.getSource('traffic')) {
      m.addSource('traffic', { type: 'raster', tiles: [`${serverUrl}/traffic/{z}/{x}/{y}.png`], tileSize: 256 });
      m.addLayer({ id: 'traffic', type: 'raster', source: 'traffic', paint: { 'raster-opacity': .7 } }, m.getStyle().layers?.find(l => l.id.startsWith('ride-'))?.id);
    } else if (!traffic && m.getLayer('traffic')) { m.removeLayer('traffic'); m.removeSource('traffic'); }
  }, [traffic, loaded]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded) return;
    const data: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: 'FeatureCollection', features: [startPoint, endPoint].filter((p): p is Coord => !!p).map(p => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: p } })) };
    const source = m.getSource('planning') as maplibregl.GeoJSONSource | undefined;
    if (source) source.setData(data); else { m.addSource('planning', { type: 'geojson', data }); m.addLayer({ id: 'planning', source: 'planning', type: 'circle', paint: { 'circle-radius': 7, 'circle-color': '#007F6D', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } }); }
    if (!selected && startPoint && !follow) { if (endPoint) { const [w, s, e, n] = routeBounds([startPoint, endPoint]); m.fitBounds([[w,s],[e,n]], { padding: fitPadding || 45, maxZoom: 16, bearing: 0, pitch: 0, duration: 400 }); } else m.easeTo({ center: startPoint, zoom: 13, padding: fitPadding, bearing: 0, pitch: 0, duration: 400 }); }
  }, [startPoint, endPoint, loaded, selected, follow, fitPadding]);
  return <View style={{ flex: 1, zIndex: 0 }}><style>{`.maplibregl-ctrl-top-right { top: 125px; right: 10px; } @media (min-width: 700px) { .maplibregl-ctrl-top-right { top: 70px; } }`}</style><div ref={div} style={{ position: 'absolute', inset: 0 }} />{error && <Text style={{ position: 'absolute', top: 8, left: 8, right: 8, padding: 8, backgroundColor: '#fff', color: '#536671', fontSize: 12 }}>Map resources unavailable. Route geometry and ETA remain available.</Text>}</View>;
}
