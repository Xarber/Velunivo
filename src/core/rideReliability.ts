import type {RideSample,RecordedRide} from './recordings';
export interface RideReliability {schema:1;samples:number;preciseGPS:number;poorGPS:number;estimatedSpeed:number;longestGapSeconds:number;bluetoothSamples:number;bluetoothInterruptions:number;peerReconnects:number;}
export function rideReliability(samples:RideSample[],peerReconnects=0):RideReliability{
 const r:RideReliability={schema:1,samples:samples.length,preciseGPS:0,poorGPS:0,estimatedSpeed:0,longestGapSeconds:0,bluetoothSamples:0,bluetoothInterruptions:0,peerReconnects:Math.max(0,Math.floor(peerReconnects))};let previous:RideSample|undefined,connected=false;
 for(const sample of [...samples].sort((a,b)=>a.fix.timestamp-b.fix.timestamp)){
  const f=sample.fix;if(Number.isFinite(f.accuracy)&&f.accuracy>=0&&f.accuracy<=35)r.preciseGPS++;else r.poorGPS++;
  if(f.speedSource==='estimated'&&(f.speed??0)>.5)r.estimatedSpeed++;
  if(previous)r.longestGapSeconds=Math.max(r.longestGapSeconds,(f.timestamp-previous.fix.timestamp)/1000);previous=sample;
  const bt=sample.bluetooth;if(bt&&!bt.simulated){r.bluetoothSamples++;if(connected&&bt.state!=='connected')r.bluetoothInterruptions++;connected=bt.state==='connected';}
 }
 return r;
}
export function reliabilityReport(ride:RecordedRide,samples:RideSample[]){return {format:'velunivo-ride-reliability',schema:1,rideId:ride.id,startedAt:ride.startedAt,endedAt:ride.endedAt,metrics:rideReliability(samples,ride.reliability?.peerReconnects),note:'Aggregate diagnostics only. No coordinates, Bluetooth credentials or media.'};}
