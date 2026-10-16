import {useEffect,useState} from 'react';
import {AppState} from 'react-native';
import {useReducedMotion} from '../components/WebMotion';
/** Short reveal in the paint leaf only. Geometry and the map never animate/rebuild. */
export function useScratchGlow(enabled:boolean,_loop:boolean,eventKey=''){
 const reduced=useReducedMotion(),[frame,setFrame]=useState({key:'',opacity:0});
 useEffect(()=>{
  if(!enabled||reduced)return;
  const started=Date.now();let raf=0,lastFrame=-Infinity,disposed=false;
  const tick=()=>{
   if(disposed)return;
   const elapsed=Date.now()-started;
   if(elapsed>=720){setFrame({key:eventKey,opacity:0});return;}
   if(elapsed-lastFrame>=30){lastFrame=elapsed;const t=elapsed/720;setFrame({key:eventKey,opacity:.8*(1-t)*(1-t)});}
   raf=requestAnimationFrame(tick);
  };
  if(AppState.currentState==='active'||AppState.currentState===null)raf=requestAnimationFrame(tick);
  const app=AppState.addEventListener('change',state=>{if(state!=='active'){cancelAnimationFrame(raf);setFrame({key:eventKey,opacity:0});}});
  return()=>{disposed=true;cancelAnimationFrame(raf);app.remove();};
 },[enabled,eventKey,reduced]);
 return !enabled||reduced?0:frame.key===eventKey?frame.opacity:.8;
}
