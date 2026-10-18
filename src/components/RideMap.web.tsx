import {useInitialMapLocation} from '../services/initialMapLocation';
import {useMarkerOpacity} from '../services/useMarkerOpacity';
import {useGhostRiders} from '../services/sampleData';
import {readBadges} from '../core/riderBadges';
import {useDisplayCosmetics} from '../services/rewardTesting';
import {useStore} from '../services/store';
import {arrowPath} from '../core/cosmeticRewards';
import ScratchWebGlow from './ScratchWebGlow';
import {useTransitLines} from '../services/useTransitLines';
import {transitGeometryPaint,transitPaint} from '../core/transitLines';
import {scratchBorders} from '../core/scratchBorders';
import {useScratchViewport} from '../services/useScratchViewport';
import {useScratchLayer} from '../services/useScratchLayer';
import {usePalette} from './ui';
import {useGroupRide} from '../groups/GroupProvider';
import {PeopleMarkers} from '../groups/peopleMarkers.web';
import {MapAreaSelection} from '../core/mapArea';
import {useMapArea} from '../services/useMapArea';
import {t} from '../i18n/core';
import Text from './LocalizedText';
import { routeLayers, ROUTE_WIDTH } from '../core/routeLayers';
import { useCameraTarget } from '../services/useCameraTarget';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {View} from 'react-native';
import { Route, Coord } from '../core/types';
import { routeBounds } from '../core/geo';
import { serverUrl } from '../services/api';
import { mapStyle } from './mapConfig';
interface MapProps {showGhosts?:boolean;bookmarks?:import('../core/recordings').RideBookmark[];mapBounds?:[number,number,number,number];scratchIndexOverride?:import('../core/scratchMap').ScratchIndex;scratchContext?:import('../services/useScratchLayer').ScratchContext;scratchHighlight?:string[];onScratchTile?(id:string):void;groupRiders?:import('../groups/model').GroupMember[]; areaSelection?:MapAreaSelection; transit?: boolean; trace?: Coord[][]; completedMeters?: number; overview?: boolean; onPan?(): void; routes: Route[]; selected: Route | null; position?: Coord; positionAt?:number;positionLabel?:string; follow?: boolean; heading?: number; navigating?: boolean; followPadding?: MapProps['fitPadding']; tilted?: boolean; overviewRequest?: number; onPick?(p: Coord,resolution?:number): void; traffic?: boolean; startPoint?: Coord; endPoint?: Coord; planningStops?:import('../core/itinerary').RouteStop[]; offlineMap?: string; fitPadding?: { top: number; bottom: number; left: number; right: number }; }
export default function RideMap({ routes, selected, position, follow, onPick, traffic, startPoint, endPoint, fitPadding, heading = 0, navigating = false, followPadding, tilted = false, overviewRequest = 0, overview = false, onPan, trace, completedMeters, transit, positionLabel,positionAt, planningStops, areaSelection,groupRiders=[],showGhosts=false,bookmarks=[],scratchContext,scratchHighlight,onScratchTile,mapBounds,scratchIndexOverride }: MapProps) {
 const initial=useInitialMapLocation(position);
 const positionOpacity=useMarkerOpacity(positionAt,undefined,positionLabel?.includes('Last known')?.45:1);
 const {bounds:scratchBounds,update:setScratchBounds}=useScratchViewport(),scratch=useScratchLayer(scratchContext,scratchBounds,scratchHighlight,scratchIndexOverride);
 const transitLines=useTransitLines(!!transit,scratchBounds);
 const ghosts=useGhostRiders(position),allRiders=useMemo(()=>showGhosts?[...groupRiders,...ghosts]:groupRiders,[showGhosts,groupRiders,ghosts]);
 const {navigationOptions:savedMapOptions}=useStore();const mapOptions=useDisplayCosmetics(savedMapOptions);const groupVideo=useGroupRide(),peoplePalette=usePalette();
  const div = useRef<HTMLDivElement>(null), map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false), [error, setError] = useState(false);
  const reportArea=useMapArea(areaSelection,loaded,async(x,y)=>{if(!map.current)throw new Error('Map unavailable');const c=map.current.unproject([x,y]);return [c.lng,c.lat];});
  useEffect(()=>{const m=map.current;if(!m||!loaded||!areaSelection)return;m.on('moveend',reportArea);reportArea();return()=>{m.off('moveend',reportArea);};},[areaSelection,loaded,reportArea]);
  const user = useRef<maplibregl.Marker | null>(null), people = useRef<PeopleMarkers | null>(null);
  const hasPosition = !!position;
  const cameraTarget = useCameraTarget(position, heading, !!follow && loaded, JSON.stringify([tilted, followPadding || fitPadding]));
  const pan = useRef(onPan);
  useEffect(() => { pan.current = onPan; }, [onPan]);
  const resolution=useRef(scratch.geometry.resolution);useEffect(()=>{resolution.current=scratch.geometry.resolution;},[scratch.geometry.resolution]);
  const click = useRef(onPick);
  useEffect(() => { click.current = onPick; }, [onPick]);
  useEffect(() => {
    if (!div.current||!initial.ready) return;
    try {
      maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
      const m = new maplibregl.Map({ container: div.current, style: mapStyle, center: initial.coordinate??[0,0], zoom: initial.coordinate?12:2, attributionControl: false }); map.current = m;
      m.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-right');
      m.on('movestart', e => {if(e.originalEvent)pan.current?.();});m.on('move',e=>{if(e.originalEvent)pan.current?.();});m.on('moveend',e=>{if(e.originalEvent)pan.current?.();});
      m.on('load', () => setLoaded(true)); m.on('error', () => setError(true));
      m.on('click', e => click.current?.([e.lngLat.lng, e.lngLat.lat],resolution.current));
      const observer = new ResizeObserver(() => m.resize()); observer.observe(div.current);
      return () => { observer.disconnect(); people.current?.clear();people.current=null;user.current?.remove(); user.current = null; m.remove(); };
    } catch { queueMicrotask(() => setError(true)); }
  // Initial coordinate is captured once; live camera updates are separate.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.ready]);
  useEffect(()=>{if(mapBounds&&loaded)map.current?.fitBounds([[mapBounds[0],mapBounds[1]],[mapBounds[2],mapBounds[3]]],{padding:fitPadding||80,maxZoom:16,duration:400});},[loaded,mapBounds,fitPadding]);
  useEffect(()=>{const m=map.current;if(!m||!loaded||(!scratchContext&&!transit))return;const update=()=>{const b=m.getBounds();setScratchBounds([b.getWest(),b.getSouth(),b.getEast(),b.getNorth()]);};m.on('move',update);m.on('resize',update);m.on('moveend',update);update();return()=>{m.off('move',update);m.off('resize',update);m.off('moveend',update);};},[loaded,scratchContext,transit,setScratchBounds]);
  useEffect(()=>{const m=map.current;if(!m||!loaded)return;if(!m.getSource('scratch-map')){m.addSource('scratch-map',{type:'geojson',data:scratch.geometry});m.addLayer({id:'scratch-fill',source:'scratch-map',type:'fill',paint:{'fill-color':['case',['get','highlight'],peoplePalette.accentDark,peoplePalette.accentLight],'fill-opacity':['*',['get','opacity'],scratch.opacity,['case',['get','highlight'],.5,1]]}},m.getStyle().layers.find(l=>l.type==='symbol')?.id);m.addLayer({id:'scratch-reveal',source:'scratch-map',type:'fill',filter:['==',['get','highlight'],true],paint:{'fill-color':peoplePalette.accentDark,'fill-opacity':0}},m.getStyle().layers.find(l=>l.type==='symbol')?.id);m.addSource('scratch-boundaries',{type:'geojson',data:scratchBorders(scratch.geometry)});m.addLayer({id:'scratch-border',source:'scratch-boundaries',type:'line',paint:{'line-color':peoplePalette.accentDark,'line-width':2.4,'line-opacity':1}},m.getStyle().layers.find(l=>l.type==='symbol')?.id);}else{(m.getSource('scratch-map') as maplibregl.GeoJSONSource).setData(scratch.geometry);(m.getSource('scratch-boundaries') as maplibregl.GeoJSONSource).setData(scratchBorders(scratch.geometry));}m.setPaintProperty('scratch-fill','fill-color',['case',['get','highlight'],peoplePalette.accentDark,peoplePalette.accentLight]);m.setPaintProperty('scratch-border','line-color',peoplePalette.accentDark);m.setPaintProperty('scratch-reveal','fill-color',peoplePalette.accentDark);const pick=(e:maplibregl.MapLayerMouseEvent)=>{const id=e.features?.[0]?.properties?.cell;if(onScratchTile&&typeof id==='string'){e.originalEvent.stopPropagation();onScratchTile(id);}};m.on('click','scratch-fill',pick);return()=>{m.off('click','scratch-fill',pick);};},[loaded,scratch.geometry,scratch.opacity,onScratchTile,scratchContext,peoplePalette.accentDark,peoplePalette.accentLight]);
  useEffect(() => { const m = map.current; if (m && loaded && !mapBounds && !selected && (!follow || !hasPosition) && Math.abs(m.getPitch()-(tilted?50:0))>.1) m.easeTo({ pitch: tilted ? 50 : 0, duration: 350 }); }, [loaded, tilted, selected, follow, hasPosition,mapBounds]);
  useEffect(() => { const m = map.current; if (!m || !loaded) return; if (follow || areaSelection) { m.dragRotate.disable(); m.touchZoomRotate.disableRotation(); m.keyboard.disableRotation(); if(areaSelection)m.touchPitch.disable();else m.touchPitch.enable(); } else { m.dragRotate.enable(); m.touchZoomRotate.enableRotation(); m.keyboard.enableRotation(); m.touchPitch.enable(); } }, [follow, loaded, areaSelection]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded) return;
    const paths = routeLayers(routes, selected, completedMeters, trace,peoplePalette.accentDark);
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
      m.setPaintProperty(id,'line-color',r.color);m.setPaintProperty(`${id}-outline`,'line-color',r.outline);
      // Existing sources must be moved too when the rider switches candidates.
      m.moveLayer(`${id}-outline`); m.moveLayer(id);
    }
  }, [routes, selected, loaded, completedMeters, trace,peoplePalette.accentDark]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded) return;
    if (selected && !follow && (!navigating || overview)) { const [w, s, e, n] = routeBounds(selected.coordinates); m.jumpTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 } }); m.fitBounds([[w, s], [e, n]], { padding: fitPadding || 24, duration: 400, maxZoom: 17, bearing: 0, pitch: tilted ? 50 : 0 }); }
  }, [routes, selected, loaded, follow, fitPadding, overviewRequest, overview, navigating, tilted]);
  useEffect(()=>{const m=map.current;if(!m||!loaded)return;const markers=(planningStops??selected?.waypoints??[]).filter(s=>s.coordinate.every(Number.isFinite)).map((stop,i)=>{const el=document.createElement('div');el.textContent=String(i+1);el.title=`${t(`Stop ${i+1}`)} · ${stop.label}`;el.setAttribute('aria-label',el.title);el.style.cssText='width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:'+peoplePalette.accentLight+';border:3px solid white;border-radius:50%;color:white;font:700 14px system-ui;box-shadow:0 2px 6px #0006';return new maplibregl.Marker({element:el}).setLngLat(stop.coordinate).addTo(m);});return()=>markers.forEach(marker=>marker.remove());},[loaded,selected,planningStops,peoplePalette.accentLight]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded) return;
    if (!position) { user.current?.remove(); user.current = null; return; }
    if (!user.current) { const element = document.createElement('div'); element.style.cssText = 'width:42px;height:42px;z-index:20;filter:drop-shadow(0 2px 4px #0005);pointer-events:none'; user.current = new maplibregl.Marker({ element, rotationAlignment: 'map', pitchAlignment: 'viewport' }).setLngLat(position).addTo(m); }
    const element = user.current.getElement(); element.setAttribute('aria-label', positionLabel || (navigating ? 'Navigation position arrow' : 'Current position'));
    // MapLibre owns the marker element opacity and overwrites direct CSS during camera updates.
    user.current.setOpacity(positionOpacity);
    element.innerHTML = navigating ? '<svg viewBox="0 0 40 40" width="42" height="42"><path fill-rule="evenodd" d="'+arrowPath(mapOptions.navigationArrow)+'" fill="#287CF5" stroke="white" stroke-width="3" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 40 40" width="42" height="42">'+(mapOptions.locationPin==='halo'?'<circle cx="20" cy="20" r="16" fill="#287CF530"/>':'')+(mapOptions.locationPin==='diamond'?'<path d="M20 7L33 20L20 33L7 20Z" fill="#287CF5" stroke="white" stroke-width="3"/>':'<circle cx="20" cy="20" r="9" fill="#287CF5" stroke="white" stroke-width="3"/>')+'</svg>';
    user.current.setLngLat(position).setRotation(navigating ? heading : 0);

  }, [position, follow, loaded, heading, tilted, fitPadding, followPadding, navigating, positionLabel, mapOptions.navigationArrow,mapOptions.locationPin,positionAt,positionOpacity]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded || !follow || !cameraTarget) return;
    m.easeTo({ center: cameraTarget.position, zoom: navigating ? 16.5 : 15, bearing: cameraTarget.heading, pitch: tilted ? 50 : 0, padding: followPadding || fitPadding, duration: cameraTarget.duration });
    // Camera targets are coalesced independently of raw sensor/marker updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraTarget]);
  useEffect(() => { const m=map.current; if (!m || !loaded || !m.getSource('openmaptiles')) return;
    if (transit && !m.getLayer('velunivo-transit')) m.addLayer({id:'velunivo-transit',type:'line',source:'openmaptiles','source-layer':'transportation',filter:['match',['get','class'],['rail','transit'],true,false],paint:transitPaint},m.getStyle().layers?.find(l=>l.id.startsWith('ride-'))?.id);
    if (!transit && m.getLayer('velunivo-transit')) m.removeLayer('velunivo-transit');
  },[transit,loaded]);
  useEffect(()=>{const m=map.current;if(!m||!loaded)return;const id='velunivo-transit-detail';if(!m.getSource(id))m.addSource(id,{type:'geojson',data:transitLines});else (m.getSource(id) as maplibregl.GeoJSONSource).setData(transitLines);if(transit&&!m.getLayer(id))m.addLayer({id,type:'line',source:id,paint:transitGeometryPaint,layout:{'line-cap':'round','line-join':'round'}},m.getStyle().layers.find(l=>l.id.startsWith('ride-'))?.id);else if(!transit&&m.getLayer(id))m.removeLayer(id);},[loaded,transit,transitLines]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded || !serverUrl) return;
    if (traffic && !m.getSource('traffic')) {
      m.addSource('traffic', { type: 'raster', tiles: [`${serverUrl}/traffic/{z}/{x}/{y}.png`], tileSize: 256 });
      m.addLayer({ id: 'traffic', type: 'raster', source: 'traffic', paint: { 'raster-opacity': .7 } }, m.getStyle().layers?.find(l => l.id.startsWith('ride-'))?.id);
    } else if (!traffic && m.getLayer('traffic')) { m.removeLayer('traffic'); m.removeSource('traffic'); }
    for(const layer of m.getStyle().layers??[])if(layer.id.startsWith('ride-'))m.moveLayer(layer.id);
  }, [traffic, loaded,routes,selected]);
  useEffect(() => {
    const m = map.current; if (!m || !loaded) return;
    const data: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: 'FeatureCollection', features: [startPoint, endPoint].filter((p): p is Coord => !!p).map(p => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: p } })) };
    const source = m.getSource('planning') as maplibregl.GeoJSONSource | undefined;
    if (source){source.setData(data);m.setPaintProperty('planning','circle-color',peoplePalette.accentLight);} else { m.addSource('planning', { type: 'geojson', data }); m.addLayer({ id: 'planning', source: 'planning', type: 'circle', paint: { 'circle-radius': 7, 'circle-color': peoplePalette.accentLight, 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } }); }
    if (!selected && startPoint && !follow) { if (endPoint) { const [w, s, e, n] = routeBounds([startPoint, endPoint]); m.fitBounds([[w,s],[e,n]], { padding: fitPadding || 45, maxZoom: 16, bearing: 0, pitch: tilted ? 50 : 0, duration: 400 }); } else m.easeTo({ center: startPoint, zoom: scratchContext==='viewer'?16:13, padding: fitPadding, bearing: 0, pitch: tilted ? 50 : 0, duration: 400 }); }
  }, [startPoint, endPoint, loaded, selected, follow, fitPadding, tilted,scratchContext,peoplePalette.accentLight]);
  useEffect(()=>{const m=map.current;if(!m||!loaded)return;
    people.current??=new PeopleMarkers((element,position)=>new maplibregl.Marker({element,anchor:'bottom'}).setLngLat(position).addTo(m));
    people.current.update(allRiders.map(r=>r.id===groupVideo.selfId&&mapOptions!==savedMapOptions?{...r,locationPin:mapOptions.locationPin,profileBadges:readBadges(mapOptions.profileBadges,mapOptions.profileBadge)}:r),groupVideo.videoFeeds,groupVideo.videoEnabled,peoplePalette.accent,peoplePalette.dark,navigating?groupVideo.pinVideo:undefined);
  },[mapOptions,savedMapOptions,groupVideo.selfId,allRiders,loaded,groupVideo.videoEnabled,groupVideo.videoFeeds,peoplePalette.accent,peoplePalette.dark,groupVideo.pinVideo,navigating]);
  useEffect(()=>{const m=map.current;if(!m||!loaded)return;const markers=bookmarks.slice(0,1000).map(bookmark=>{const el=document.createElement('div');el.setAttribute('aria-label',bookmark.name);el.title=bookmark.name;el.innerHTML='<svg width="28" height="32" viewBox="0 0 28 32"><path fill-rule="evenodd" d="M5 2H23V29L14 23L5 29Z" fill="'+peoplePalette.accentLight+'" stroke="white" stroke-width="2"/></svg>';return new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat(bookmark.coordinate).addTo(m);});return()=>markers.forEach(marker=>marker.remove());},[bookmarks,loaded,peoplePalette.accentLight]);
  return <View style={{ flex: 1, zIndex: 0 }}><ScratchWebGlow map={map} loaded={loaded} geometry={scratch.geometry} opacity={scratch.opacity} loop={scratch.glowLoop}/><style>{`.maplibregl-ctrl-top-right { top: 125px; right: 10px; } @media (min-width: 700px) { .maplibregl-ctrl-top-right { top: 70px; } }`}</style><div ref={div} style={{ position: 'absolute', inset: 0 }} />{error && <Text style={{ position: 'absolute', top: 8, left: 8, right: 8, padding: 8, backgroundColor: '#fff', color: '#536671', fontSize: 12 }}>Map resources unavailable. Route geometry and ETA remain available.</Text>}</View>;
}
