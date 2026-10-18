import {useEffect,useRef,useState} from 'react';
import {useLastBattery} from './lastBattery';
import {recordedRides,rideSamples,subscribeRides} from './rideHistory';
import {BatteryCurveTrainer,BatteryCurve,consumeEstimatedCharge} from '../core/rideBatteryEstimate';
import {useRideChrome} from './rideLock';
const curves=new Map<string,{key:string;job:Promise<BatteryCurve|null>}>(),anchors=new Map<string,{timestamp:number;meters:number}>();
export function useRideBatteryEstimate(id:string,meters:number|undefined,now:number,connected:boolean,enabled:boolean){
 const last=useLastBattery(id),[curve,setCurve]=useState<BatteryCurve|null>(null),active=useRideChrome().active,previousActive=useRef(active);
 useEffect(()=>{if(!active&&previousActive.current)anchors.delete(id);previousActive.current=active;if(connected&&last&&meters!==undefined){const a=anchors.get(id);if(!a||a.timestamp!==last.timestamp)anchors.set(id,{timestamp:last.timestamp,meters});}},[active,id,connected,last,meters]);
 useEffect(()=>{if(!enabled||id==='sharing-scooter')return;let alive=true,running=false,again=false;
  const load=async()=>{if(running){again=true;return;}running=true;try{const rides=(await recordedRides()).filter(r=>r.vehicle.id===id&&r.batteryUsageSource==='bluetooth'&&r.status!=='recording').sort((a,b)=>b.startedAt-a.startedAt).slice(0,30),key=JSON.stringify(rides.map(r=>[r.id,r.samples,r.batteryUsagePercent,r.endedAt]));if(!alive)return;let cached=curves.get(id);if(!cached||cached.key!==key){const job=(async()=>{if(rides.length<10)return null;const trainer=new BatteryCurveTrainer(rides,{id});for(const ride of rides){trainer.add(ride,await rideSamples(ride));await new Promise(resolve=>setTimeout(resolve,0));}return trainer.finish();})();cached={key,job};curves.set(id,cached);if(curves.size>10)curves.delete(curves.keys().next().value!);}const value=await cached.job;if(alive)setCurve(value);}catch{curves.delete(id);}finally{running=false;if(again&&alive){again=false;void load();}}};
  void load();const stop=subscribeRides(()=>void load());return()=>{alive=false;stop();};
 },[id,enabled]);
 if(!last||!curve||!enabled||now-(last.measuredAt??last.timestamp)>3*86400000||last.timestamp>now+1000)return null;
 const anchor=anchors.get(id),distance=active?Math.max(0,(meters??0)-(anchor?.timestamp===last.timestamp?anchor.meters:0)):0,initial=Math.max(0,last.percent-5*Math.max(0,now-last.timestamp)/86400000),percent=consumeEstimatedCharge(initial,distance,curve);
 return percent===null?null:{percent,count:curve.count,timestamp:last.measuredAt??last.timestamp,lastPercent:last.measuredPercent??last.percent};
}
