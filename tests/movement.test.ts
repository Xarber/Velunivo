import test from 'node:test';
import assert from 'node:assert/strict';
import { MovementTracker } from '../src/core/movement';
import { Fix } from '../src/core/types';
import { appendSample, RecordedRide, RideSample } from '../src/core/recordings';
import { exportRecordedGPX } from '../src/core/gpx';
import { createVehicle } from '../src/core/vehicles';
import { routeLayers, ROUTE_GRAY } from '../src/core/routeLayers';
import { guidance } from '../src/core/navigation';
const fix=(meters:number,time:number,speed:number|null=0,accuracy=5):Fix=>({coordinate:[meters/111195,0],timestamp:time,accuracy,speed});
test('stationary jitter stays anchored indefinitely; it adds no distance, trace or GPX zigzags',()=>{
 const tracker=new MovementTracker();let previous:Fix|null=null;
 let ride:RecordedRide={id:'test',name:'Test',vehicle:createVehicle('escooter','test'),startedAt:1000,status:'recording',samples:0,chunks:0,meters:0,preview:[],startLabel:'A',endLabel:'B'};
 const samples:RideSample[]=[];
 for(let i=0;i<90;i++){
  const raw=fix(i===0?0:[3,-4,6,-6,2][i%5],1000+i*1000,i%2?null:0),tracked=tracker.next(raw)!;
  assert.deepEqual(tracked.fix.coordinate,[0,0]);
  const sample={fix:raw,pathFix:tracked.point,breakBefore:tracked.breakBefore,compass:null,accelerometer:null,gyroscope:null};samples.push(sample);
  ride=appendSample(ride,sample,previous);if(tracked.point)previous=tracked.point;
 }
 assert.equal(ride.samples,90);assert.equal(ride.meters,0);assert.equal(ride.preview.length,1);assert.equal(ride.trace?.[0].length,1);
 assert.equal((exportRecordedGPX(samples).match(/<trkpt /g)||[]).length,1);
 assert.notDeepEqual(samples[1].fix.coordinate,samples[1].pathFix?.coordinate,'raw readings remain intact');
});
test('normal movement resumes, slow travel accumulates, and a one-fix teleport is rejected',()=>{
 const moving=new MovementTracker();moving.next(fix(0,1000,5));
 assert.ok(moving.next(fix(5,2000,5))?.point);
 assert.equal(moving.next(fix(500,3000,5))?.point,null);
 assert.ok(moving.next(fix(10,4000,5))?.point);
 const slow=new MovementTracker();slow.next(fix(0,1000,null));
 const points=[];for(let i=1;i<15;i++){const result=slow.next(fix(i*2,1000+i*1000,null));if(result?.point)points.push(result.point);}
 assert.ok(points.length>=2,'slow riding is not permanently suppressed');
 assert.ok(points.at(-1)!.coordinate[0]>20/111195);
});
test('poor fixes, GPS gaps and out-of-order callbacks cannot bridge the travelled trace',()=>{
 const tracker=new MovementTracker();tracker.next(fix(0,1000,5));
 assert.equal(tracker.next(fix(8,1000,5)),null);
 assert.equal(tracker.next(fix(20,2000,5,999)),null);
 assert.equal(tracker.next(fix(30,3000,5))?.breakBefore,true);
 assert.equal(tracker.next(fix(40,22000,5))?.breakBefore,true);
 assert.equal(tracker.next({...fix(0,23000),coordinate:[NaN,0]}),null);
 const trace=[[[0,0],[.0001,0]],[[.0005,0],[.0006,0]]] as [number,number][][];
 const layers=routeLayers([],null,undefined,trace);assert.equal(layers.length,2);assert.ok(layers.every(layer=>layer.color===ROUTE_GRAY));
});
test('GPS-guided route progress and completed line stay still during stationary jitter',()=>{
 const now=Date.now(),tracker=new MovementTracker();
 const route={coordinates:[[0,0],[.002,0]],steps:[],details:{}} as unknown as Parameters<typeof guidance>[0];
 let along:number|undefined;
 for(let i=0;i<10;i++){
  const result=tracker.next(fix(i===0?0:i%2?6:-6,now+i,0))!;
  const g=guidance(route,result.fix,along);along=g.along;assert.equal(g.along,0);assert.equal(g.offRoute,false);
 }
});
