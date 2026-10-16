import React,{memo,useMemo} from 'react';
import {Polygon,Polyline} from 'react-native-maps';
import {GeoJSONSource,Layer} from '@maplibre/maplibre-react-native';
import {ScratchGeometry} from '../core/scratchMap';
import {scratchBorders} from '../core/scratchBorders';
import {nativeCoordinates} from '../core/nativeCoordinates';
import {useScratchGlow} from '../services/useScratchGlow';
interface Props {geometry:ScratchGeometry;opacity:number;loop:boolean;onPick?(id:string):void;}
/** Animation lives in this leaf; camera, telemetry, routes and the surrounding UI do not rerender. */
export const NativeScratchOverlay=memo(function NativeScratchOverlay({geometry,opacity,loop,onPick}:Props){
 const borders=useMemo(()=>scratchBorders(geometry),[geometry]),highlighted=useMemo(()=>geometry.features.filter(f=>f.properties.highlight),[geometry]);
 return <>{geometry.features.filter(f=>!f.properties.highlight).map(f=><Polygon key={`scratch-${f.id}`} coordinates={nativeCoordinates(f.geometry.coordinates[0])} holes={f.geometry.coordinates.slice(1).map(nativeCoordinates)} fillColor={`rgba(0,127,109,${f.properties.opacity*opacity})`} strokeColor="transparent" strokeWidth={0} tappable={!!onPick} onPress={()=>onPick?.(f.id)}/>)}<NativeScratchReveal features={highlighted} loop={loop} onPick={onPick}/>{borders.features.map(f=><Polyline key={f.id} coordinates={nativeCoordinates(f.geometry.coordinates)} strokeColor="#79EBD1" strokeWidth={2.4} zIndex={20}/>)}</>;
});
const NativeScratchReveal=memo(function NativeScratchReveal({features,loop,onPick}:{features:ScratchGeometry['features'];loop:boolean;onPick?:Props['onPick']}){const glow=useScratchGlow(features.length>0,loop,features.map(f=>f.id).join(',')),shapes=useMemo(()=>features.map(f=>({id:f.id,coordinates:nativeCoordinates(f.geometry.coordinates[0]),holes:f.geometry.coordinates.slice(1).map(nativeCoordinates)})),[features]);return <>{shapes.map(f=><Polygon key={`scratch-${f.id}`} coordinates={f.coordinates} holes={f.holes} fillColor={`rgba(100,220,197,${glow*.4})`} strokeColor="transparent" strokeWidth={0} tappable={!!onPick} onPress={()=>onPick?.(f.id)}/>)}</>;});
export const VectorScratchOverlay=memo(function VectorScratchOverlay({geometry,opacity,loop,onPick}:Props){
 const borders=useMemo(()=>scratchBorders(geometry),[geometry]);
 return <>{!!geometry.features.length&&<GeoJSONSource id="scratch-map" data={geometry} onPress={onPick?e=>{const id=e.nativeEvent.features[0]?.properties?.cell;if(typeof id==='string')onPick(id);}:undefined}><VectorScratchFill opacity={opacity} loop={loop} highlighted={geometry.features.some(f=>f.properties.highlight)} eventKey={geometry.features.filter(f=>f.properties.highlight).map(f=>f.id).join(',')}/></GeoJSONSource>}{!!geometry.features.length&&<GeoJSONSource id="scratch-boundaries" data={borders}><Layer id="scratch-border" type="line" paint={{'line-color':'#79EBD1','line-width':2.4,'line-opacity':1}}/></GeoJSONSource>}</>;
});

function VectorScratchFill({opacity,loop,highlighted,eventKey,source}:{opacity:number;loop:boolean;highlighted:boolean;eventKey:string;source?:string}){const glow=useScratchGlow(highlighted,loop,eventKey);return <Layer source={source??'scratch-map'} id="scratch-fill" type="fill" paint={{'fill-color':['case',['get','highlight'],'#64DCC5','#007F6D'],'fill-opacity':['*',['get','opacity'],opacity,['case',['get','highlight'],glow,1]]}}/>;}
