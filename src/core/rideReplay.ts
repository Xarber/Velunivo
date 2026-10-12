import {RecordedRide,RideSample} from './recordings';
import {BridgeSnapshot,Metric,Telemetry} from '../bluetooth/types';
import {MovementTracker} from './movement';
import {distance} from './geo';
import {Fix} from './types';
export interface ReplayFrame {at:number;fix:Fix|null;sample:RideSample;meters:number;telemetry:BridgeSnapshot;}
/** Snapshot recorded data once; seeking never reads live sensors or publishes to the BLE bridge. */
export function replayFrames(ride:RecordedRide,samples:RideSample[]):ReplayFrame[]{
 const movement=new MovementTracker(),frames:ReplayFrame[]=[],metrics=[...new Set(samples.flatMap(s=>Object.keys(s.bluetooth?.fields || {})))] as Metric[];
 let fix:Fix|null=null,previous:Fix|null=null,meters=0,fields:Telemetry={},pluginId:string|undefined;
 for(const sample of [...samples].sort((a,b)=>a.fix.timestamp-b.fix.timestamp)){
  const tracked=sample.pathFix===undefined?movement.next(sample.fix):undefined;const point=sample.pathFix===undefined?tracked?.point:sample.pathFix;
  if(point){if(previous && !(sample.breakBefore ?? tracked?.breakBefore))meters+=distance(previous.coordinate,point.coordinate);previous=point;fix={...sample.fix,coordinate:sample.displayCoordinate||point.coordinate};}else if(fix)fix={...sample.fix,coordinate:fix.coordinate};
  if(sample.bluetooth){if(pluginId!==sample.bluetooth.pluginId)fields={};pluginId=sample.bluetooth.pluginId;fields={...fields,...sample.bluetooth.fields};}
  frames.push({at:Math.max(0,sample.fix.timestamp-ride.startedAt),fix,sample,meters,telemetry:{state:sample.bluetooth?.state || 'disconnected',message:'Recorded telemetry · replay',vehicleId:ride.vehicle.id,pluginId,simulated:sample.bluetooth?.simulated,fields,extensions:{},capabilities:{fields:metrics,commands:['readTelemetry'],authentication:'Recorded data',limitations:['Historical readings, not a live Bluetooth connection']}}});
 }
 return frames;
}
export function replayFrameAt(frames:ReplayFrame[],elapsed:number){let low=0,high=frames.length-1,result=-1;while(low<=high){const mid=(low+high)>>>1;if(frames[mid].at<=elapsed){result=mid;low=mid+1;}else high=mid-1;}return result<0?undefined:frames[result];}
