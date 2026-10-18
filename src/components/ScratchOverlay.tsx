import {usePalette} from './ui';
import {rgba} from '../core/themeColors';
import React,{memo,useMemo,useEffect,useState} from 'react';
import Animated,{useSharedValue,useAnimatedProps,withTiming,Easing,ReduceMotion,processColor,interpolateColor,cancelAnimation} from 'react-native-reanimated';
import {useReducedMotion} from './WebMotion';
import {Polygon,Polyline} from 'react-native-maps';
import {GeoJSONSource,Layer} from '@maplibre/maplibre-react-native';
import {ScratchGeometry} from '../core/scratchMap';
import {scratchBorders} from '../core/scratchBorders';
import {nativeCoordinates} from '../core/nativeCoordinates';
const AnimatedPolygon=Animated.createAnimatedComponent(Polygon);
interface Props {geometry:ScratchGeometry;opacity:number;loop:boolean;onPick?(id:string):void;}
/** Animation lives in this leaf; camera, telemetry, routes and the surrounding UI do not rerender. */
export const NativeScratchOverlay=memo(function NativeScratchOverlay({geometry,opacity,loop,onPick}:Props){
 const p=usePalette();const borders=useMemo(()=>scratchBorders(geometry),[geometry]),highlighted=useMemo(()=>geometry.features.filter(f=>f.properties.highlight),[geometry]);
 return <>{geometry.features.filter(f=>!f.properties.highlight).map(f=><Polygon key={`scratch-${f.id}`} coordinates={nativeCoordinates(f.geometry.coordinates[0])} holes={f.geometry.coordinates.slice(1).map(nativeCoordinates)} fillColor={rgba(p.accentLight,f.properties.opacity*opacity)} strokeColor="transparent" strokeWidth={0} tappable={!!onPick} onPress={()=>onPick?.(f.id)}/>)}<NativeScratchReveal features={highlighted} loop={loop} onPick={onPick}/>{borders.features.map(f=><Polyline key={f.id} coordinates={nativeCoordinates(f.geometry.coordinates)} strokeColor={p.accentDark} strokeWidth={2.4} zIndex={20}/>)}</>;
});
const NativeScratchReveal=memo(function NativeScratchReveal({features,onPick}:{features:ScratchGeometry['features'];loop:boolean;onPick?:Props['onPick']}){const p=usePalette(),reduced=useReducedMotion(),progress=useSharedValue(0),eventKey=features.map(f=>f.id).join(','),color=rgba(p.accentDark,.32);useEffect(()=>{progress.set(reduced||!eventKey?0:1);if(!reduced&&eventKey)progress.set(withTiming(0,{duration:480,easing:Easing.bezier(.23,1,.32,1),reduceMotion:ReduceMotion.System}));return()=>cancelAnimation(progress);},[eventKey,reduced,progress]);const paint=useAnimatedProps(()=>({fillColor:processColor(interpolateColor(progress.get(),[0,1],['transparent',color])) as unknown as string}));const shapes=useMemo(()=>features.map(f=>({id:f.id,coordinates:nativeCoordinates(f.geometry.coordinates[0]),holes:f.geometry.coordinates.slice(1).map(nativeCoordinates)})),[features]);return <>{shapes.map(f=><AnimatedPolygon key={`scratch-${f.id}`} coordinates={f.coordinates} holes={f.holes} animatedProps={paint} fillColor="transparent" strokeColor="transparent" strokeWidth={0} tappable={!!onPick} onPress={()=>onPick?.(f.id)}/>)}</>;});
export const VectorScratchOverlay=memo(function VectorScratchOverlay({geometry,opacity,loop,onPick}:Props){
 const p=usePalette();const borders=useMemo(()=>scratchBorders(geometry),[geometry]);
 return <>{!!geometry.features.length&&<GeoJSONSource id="scratch-map" data={geometry} onPress={onPick?e=>{const id=e.nativeEvent.features[0]?.properties?.cell;if(typeof id==='string')onPick(id);}:undefined}><VectorScratchFill opacity={opacity} loop={loop} highlighted={geometry.features.some(f=>f.properties.highlight)} eventKey={geometry.features.filter(f=>f.properties.highlight).map(f=>f.id).join(',')}/></GeoJSONSource>}{!!geometry.features.length&&<GeoJSONSource id="scratch-boundaries" data={borders}><Layer id="scratch-border" type="line" paint={{'line-color':p.accentDark,'line-width':2.4,'line-opacity':1}}/></GeoJSONSource>}</>;
});

function VectorScratchFill({opacity,highlighted,eventKey,source}:{opacity:number;loop:boolean;highlighted:boolean;eventKey:string;source?:string}){const p=usePalette(),reduced=useReducedMotion(),[reveal,setReveal]=useState('');useEffect(()=>{if(!highlighted||reduced)return;const frame=requestAnimationFrame(()=>setReveal(eventKey)),timer=setTimeout(()=>setReveal(''),48);return()=>{cancelAnimationFrame(frame);clearTimeout(timer);};},[eventKey,highlighted,reduced]);const visible=highlighted&&!reduced&&reveal===eventKey;return <><Layer source={source??'scratch-map'} id="scratch-fill" type="fill" paint={{'fill-color':p.accentLight,'fill-opacity':['*',['get','opacity'],opacity,['case',['get','highlight'],0,1]]}}/><Layer source={source??'scratch-map'} id="scratch-reveal" type="fill" filter={['==',['get','highlight'],true]} paint={{'fill-color':p.accentDark,'fill-opacity-transition':{duration:visible?0:480,delay:0},'fill-opacity':visible?.8*opacity:0}}/></>;}
