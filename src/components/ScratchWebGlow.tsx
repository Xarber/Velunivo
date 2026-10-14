import {useEffect,memo,RefObject} from 'react';
import type {Map} from 'maplibre-gl';
import {ScratchGeometry} from '../core/scratchMap';
import {useScratchGlow} from '../services/useScratchGlow';
/** Changes only a GPU paint uniform; no source setData, H3 rebuild or parent-map rerender. */
export default memo(function ScratchWebGlow({map,loaded,geometry,opacity,loop}:{map:RefObject<Map|null>;loaded:boolean;geometry:ScratchGeometry;opacity:number;loop:boolean}){
 const glow=useScratchGlow(geometry.features.some(f=>f.properties.highlight),loop);
 useEffect(()=>{const m=map.current;if(loaded&&m?.getLayer('scratch-fill'))m.setPaintProperty('scratch-fill','fill-opacity',['*',['get','opacity'],opacity,['case',['get','highlight'],glow,1]]);},[map,loaded,geometry,opacity,glow]);return null;
});
