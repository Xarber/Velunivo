import { routeLayers, ROUTE_WIDTH } from '../core/routeLayers';
import { useCameraTarget } from '../services/useCameraTarget';
import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { View, Text } from 'react-native';
import { Route, Coord } from '../core/types';
import { routeBounds } from '../core/geo';
import { serverUrl } from '../services/api';
import { mapStyle } from './mapConfig';
interface MapProps { transit?: boolean; trace?: Coord[][]; completedMeters?: number; overview?: boolean; onPan?(): void; routes: Route[]; selected: Route | null; position?: Coord; follow?: boolean; heading?: number; navigating?: boolean; followPadding?: MapProps['fitPadding']; tilted?: boolean; overviewRequest?: number; onPick?(p: Coord): void; traffic?: boolean; startPoint?: Coord; endPoint?: Coord; offlineMap?: string; fitPadding?: { top: number; bottom: number; left: number; right: number }; }
export default function RideMap({ routes, selected, position, follow, onPick, traffic, startPoint, endPoint, fitPadding, heading = 0, navigating = false, followPadding, tilted = false, overviewRequest = 0, overview = false, onPan, trace, completedMeters, transit }: MapProps) {
  const div = useRef<HTMLDivElement>(null), map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false), [error, setError] = useState(false);
  const user = useRef<maplibregl.Marker | null>(null);
  const hasPosition = !!position;
  const cameraTarget = useCameraTarget(position, heading, !!follow && loaded, JSON.stringify([tilted, followPadding || fitPadding]));
  const pan = useRef(onPan);
  useEffect(() => { pan.current = onPan; }, [onPan]);
  const click = useRef(onPick);
  useEffect(() => { click.current = onPick; }, [onPick]);
  useEffect(() => {
    if (!div.current) return;
    try {
      maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
      const m = new maplibregl.Map({ container: div.current, style: mapStyle, center: [9.186, 45.468], zoom: 12, attributionControl: false }); map.current = m;
      m.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-right');
      m.on('dragstart', () => pan.current?.());
      m.on('load', () => setLoaded(true)); m.on('error', () => setError(true));
      m.on('click', e => click.current?.([e.lngLat.lng, e.lngLat.lat]));
      const observer = new ResizeObserver(() => m.resize()); observer.observe(div.current);
      return () => { observer.disconnect(); user.current?.remove(); user.current = null; m.remove(); };
    } catch { queueMicrotask(() => setError(true)); }
  }, []);
  useEffect(() => { const m = map.current; if (m && loaded && !selected && (!follow || !hasPosition)) m.easeTo({ pitch: tilted ? 50 : 0, duration: 350 }); }, [loaded, tilted, selected, follow, hasPosition]);
  useEffect(() => { const m = map.current; if (!m || !loaded) return; if (follow) { m.dragRotate.disable(); m.touchZoomRotate.disableRotation(); m.keyboard.disableRotation(); } else { m.dragRotate.enable(); m.touchZoomRotate.enableRotation(); m.keyboard.enableRotation(); } }, [follow, loaded]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded) return;
    const paths = routeLayers(routes, selected, completedMeters, trace);
    const wanted = new Set(paths.map(r => `ride-${r.id}`));
    for (const layer of m.getStyle().layers ?? []) if (layer.id.startsWith('ride-') && !wanted.has(layer.id.replace(/-outline$/, ''))) m.removeLayer(layer.id);
    for (const source of Object.keys(m.getStyle().sources)) if (source.startsWith('ride-') && !wanted.has(source)) m.removeSource(source);
    for (const r of paths) {
      const id = `ride-${r.id}`, data: GeoJSON.Feature<GeoJSON.LineString> = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: r.coordinates } };
      const source = m.getSource(id) as maplibregl.GeoJSONSource | undefined;
      if (source) source.setData(data); else {
        m.addSource(id, { type: 'geojson', data });
        m.addLayer({ id: `${id}-outline`, type: 'line', source: id, paint: { 'line-color': r.outline, 'line-width': ROUTE_WIDTH + 3 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
        m.addLayer({ id, type: 'line', source: id, paint: { 'line-color': r.color, 'line-width': ROUTE_WIDTH }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      }
      // Existing sources must be moved too when the rider switches candidates.
      m.moveLayer(`${id}-outline`); m.moveLayer(id);
    }
  }, [routes, selected, loaded, completedMeters, trace]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded) return;
    if (selected && !follow && (!navigating || overview)) { const [w, s, e, n] = routeBounds(selected.coordinates); m.jumpTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 } }); m.fitBounds([[w, s], [e, n]], { padding: fitPadding || 24, duration: 400, maxZoom: 17, bearing: 0, pitch: tilted ? 50 : 0 }); }
  }, [routes, selected, loaded, follow, fitPadding, overviewRequest, overview, navigating, tilted]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded) return;
    if (!position) { user.current?.remove(); user.current = null; return; }
    if (!user.current) { const element = document.createElement('div'); element.style.cssText = 'width:42px;height:42px;z-index:20;filter:drop-shadow(0 2px 4px #0005);pointer-events:none'; user.current = new maplibregl.Marker({ element, rotationAlignment: 'map', pitchAlignment: 'viewport' }).setLngLat(position).addTo(m); }
    const element = user.current.getElement(); element.setAttribute('aria-label', navigating ? 'Navigation position arrow' : 'Current position');
    element.innerHTML = navigating ? '<svg viewBox="0 0 40 40" width="42" height="42"><path d="M20 3L34 35L20 28L6 35Z" fill="#287CF5" stroke="white" stroke-width="3" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 40 40" width="42" height="42"><circle cx="20" cy="20" r="9" fill="#287CF5" stroke="white" stroke-width="3"/></svg>';
    user.current.setLngLat(position).setRotation(navigating ? heading : 0);

  }, [position, follow, loaded, heading, tilted, fitPadding, followPadding, navigating]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded || !follow || !cameraTarget) return;
    m.easeTo({ center: cameraTarget.position, zoom: navigating ? 16.5 : 15, bearing: cameraTarget.heading, pitch: tilted ? 50 : 0, padding: followPadding || fitPadding, duration: cameraTarget.duration });
    // Camera targets are coalesced independently of raw sensor/marker updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraTarget]);
  useEffect(() => { const m=map.current; if (!m || !loaded || !m.getSource('openmaptiles')) return;
    if (transit && !m.getLayer('velunivo-transit')) m.addLayer({id:'velunivo-transit',type:'line',source:'openmaptiles','source-layer':'transportation',filter:['match',['get','class'],['rail','transit'],true,false],paint:{'line-color':'#A478E8','line-width':3,'line-opacity':.85}},m.getStyle().layers?.find(l=>l.id.startsWith('ride-'))?.id);
    if (!transit && m.getLayer('velunivo-transit')) m.removeLayer('velunivo-transit');
  },[transit,loaded]);
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
    if (!selected && startPoint && !follow) { if (endPoint) { const [w, s, e, n] = routeBounds([startPoint, endPoint]); m.fitBounds([[w,s],[e,n]], { padding: fitPadding || 45, maxZoom: 16, bearing: 0, pitch: tilted ? 50 : 0, duration: 400 }); } else m.easeTo({ center: startPoint, zoom: 13, padding: fitPadding, bearing: 0, pitch: tilted ? 50 : 0, duration: 400 }); }
  }, [startPoint, endPoint, loaded, selected, follow, fitPadding, tilted]);
  return <View style={{ flex: 1, zIndex: 0 }}><style>{`.maplibregl-ctrl-top-right { top: 125px; right: 10px; } @media (min-width: 700px) { .maplibregl-ctrl-top-right { top: 70px; } }`}</style><div ref={div} style={{ position: 'absolute', inset: 0 }} />{error && <Text style={{ position: 'absolute', top: 8, left: 8, right: 8, padding: 8, backgroundColor: '#fff', color: '#536671', fontSize: 12 }}>Map resources unavailable. Route geometry and ETA remain available.</Text>}</View>;
}
