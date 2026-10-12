import {MovementTracker} from './movement';
import {smoothRecordedSamples,recordedTrace} from './recordedPath';
import {distance} from './geo';
import type {RecordedRide,RideSample} from './recordings';
/** Only derived display geometry is repaired; original GPS, sensors and BLE remain intact. */
export function repairRecordedRide(ride:RecordedRide,samples:RideSample[]){
 if(!samples.length||samples.length<ride.samples)return {summary:{...ride,pathCleanupVersion:2 as const},samples};
 const tracker=new MovementTracker();
 const derived=samples.map(s=>{const {displayCoordinate: _display,...original}=s;const tracked=tracker.next(s.fix);return {...original,...(s.pathFix===undefined?{pathFix:tracked?.point??null,breakBefore:s.breakBefore||tracked?.breakBefore}:{})};});
 const cleaned=smoothRecordedSamples(derived),trace=recordedTrace(cleaned),flat=trace.flat(),stride=Math.max(1,Math.ceil(flat.length/256));
 let meters=0;for(const segment of trace)for(let i=1;i<segment.length;i++)meters+=distance(segment[i-1],segment[i]);
 const last=samples.at(-1)?.fix.timestamp;
 const summary:RecordedRide={...ride,pathCleanupVersion:2,trace,preview:flat.filter((_,i)=>i%stride===0||i===flat.length-1),...(samples.length>=3?{meters,start:flat[0]??ride.start,end:flat.at(-1)??ride.end}:{}),...(ride.status==='arrived'&&last&&ride.endedAt&&last<ride.endedAt?{endedAt:last}:{})};
 return {summary,samples:cleaned};
}
