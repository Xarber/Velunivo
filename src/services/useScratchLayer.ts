import {useMemo} from 'react';
import {useStore} from './store';
import {useScratchIndex} from './scratchMap';
import {scratchGeometry,scratchVisible} from '../core/scratchMap';
export type ScratchContext='home'|'ride'|'viewer';
export function useScratchLayer(context:ScratchContext|undefined,bounds:[number,number,number,number],highlight:readonly string[]=[]){const {navigationOptions:n}=useStore(),snapshot=useScratchIndex(),visible=!!context&&(context==='viewer'||n.scratchEnabled&&scratchVisible(n.scratchDisplay,context==='ride'));const key=bounds.map(x=>x.toFixed(4)).join(','),marked=highlight.join(',');return {opacity:context==='ride'?.14:.34,geometry:useMemo(()=>visible?scratchGeometry(snapshot.index,key.split(',').map(Number) as typeof bounds,marked?marked.split(','):[]):{type:'FeatureCollection' as const,features:[]},[visible,snapshot.index,key,marked])};}
