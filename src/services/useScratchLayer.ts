import {useMemo,useEffect,useState} from 'react';
import {useStore} from './store';
import {useScratchIndex} from './scratchMap';
import {ScratchIndex,scratchGeometry,scratchVisible} from '../core/scratchMap';
export type ScratchContext='home'|'ride'|'viewer';
export function useScratchLayer(context:ScratchContext|undefined,bounds:[number,number,number,number],highlight:readonly string[]=[],override?:ScratchIndex){
 const {navigationOptions:n}=useStore(),visible=!!context&&(!!override||context==='viewer'||n.scratchEnabled&&scratchVisible(n.scratchDisplay,context==='ride'));
 const snapshot=useScratchIndex(visible&&!override);
 const [expired,setExpired]=useState<number|null>(()=>snapshot.recent&&Date.now()-snapshot.recent.at>=900?snapshot.recent.at:null),recent=visible&&!override&&!highlight.length?snapshot.recent:undefined;
 useEffect(()=>{if(!recent)return;const remaining=900-(Date.now()-recent.at);if(remaining<=0){const timer=setTimeout(()=>setExpired(recent.at),0);return()=>clearTimeout(timer);}const timer=setTimeout(()=>setExpired(recent.at),remaining);return()=>clearTimeout(timer);},[recent]);
 const marked=(highlight.length?highlight:recent&&expired!==recent.at?[recent.cell]:[]).join(','),key=bounds.map(x=>x.toFixed(4)).join(','),index=override??snapshot.index;
 const geometry=useMemo(()=>visible?scratchGeometry(index,key.split(',').map(Number) as typeof bounds,marked?marked.split(','):[],n.scratchStyle):{type:'FeatureCollection' as const,features:[]},[visible,index,key,marked,n.scratchStyle]);
 return {opacity:context==='ride'?.26:.34,geometry,glowLoop:highlight.length>0};
}
