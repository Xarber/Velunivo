import {useEffect,useState} from 'react';
import {AppState} from 'react-native';
import {useReducedMotion} from '../components/WebMotion';
/** Only changes layer opacity. Never recalculates H3 geometry; paused in the background. */
export function useScratchGlow(enabled:boolean,loop:boolean){
 const reduced=useReducedMotion(),[phase,setPhase]=useState(0);
 useEffect(()=>{if(!enabled||reduced)return;let timer:ReturnType<typeof setInterval>|undefined;const started=Date.now(),reset=setTimeout(()=>setPhase(0),0);const stop=()=>{clearInterval(timer);timer=undefined;};const start=()=>{stop();timer=setInterval(()=>setPhase((Date.now()-started)/1000),200);};if(AppState.currentState==='active'||AppState.currentState===null)start();const app=AppState.addEventListener('change',state=>{if(state==='active')start();else stop();});return()=>{clearTimeout(reset);stop();app.remove();};},[enabled,loop,reduced]);
 return !enabled||reduced ? .5 : loop ? .5+.2*Math.sin(phase*Math.PI) : Math.max(0,.85-phase);
}
