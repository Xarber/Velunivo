import {test} from 'node:test';import assert from 'node:assert/strict';
import {smoothRecordedSamples,recordedTrace} from '../src/core/recordedPath';
import {RideSample} from '../src/core/recordings';
const samples=(offsets:number[])=>offsets.map((offset,i)=>{const fix={coordinate:[9+i*.0001,45+offset/111320] as [number,number],timestamp:1000+i*2000,accuracy:10,speed:4,heading:undefined};return {fix,pathFix:fix,compass:null,accelerometer:null,gyroscope:null} as RideSample;});
test('cleanup straightens meter-scale jitter but preserves original GPS and telemetry',()=>{const input=samples([0,1,-1,2,0]),out=smoothRecordedSamples(input);assert.equal(out[2].displayCoordinate?.[1],45);assert.deepEqual(out[2].fix,input[2].fix);assert.equal(input[2].displayCoordinate,undefined);assert.equal(recordedTrace(out)[0].length,5);});
test('cleanup retains deliberate park deviations, stops and trace interruptions',()=>{const input=samples([0,1,12,1,0]);assert.equal(smoothRecordedSamples(input)[2].displayCoordinate,undefined);input[2].pathFix={...input[2].fix,speed:0};assert.equal(smoothRecordedSamples(input)[2].displayCoordinate,undefined);input[3].breakBefore=true;assert.equal(recordedTrace(smoothRecordedSamples(input)).length,2);});

import {repairRecordedRide} from '../src/core/repairRide';
import {createVehicle} from '../src/core/vehicles';
const oldRide={id:'old',vehicle:createVehicle('escooter'),name:'Ride',startLabel:'Start',endLabel:'End',startedAt:1000,endedAt:60000,status:'arrived' as const,samples:5,chunks:1,meters:1000,preview:[]};
test('old raw paths get the same stationary deadzone; arrived end time uses the final recorded fix',()=>{const input=samples([0,1,-1,1,0]).map(s=>({...s,fix:{...s.fix,coordinate:[9+(s.fix.timestamp%3)*.000001,45] as [number,number],speed:0},pathFix:undefined}));const repaired=repairRecordedRide(oldRide,input);assert.equal(repaired.summary.pathCleanupVersion,2);assert.equal(repaired.summary.meters,0);assert.equal(repaired.summary.endedAt,9000);assert.equal(repaired.summary.trace?.[0].length,1);assert.deepEqual(repaired.samples.map(s=>s.fix),input.map(s=>s.fix));});
test('old paths retain genuine detours and interruptions during retroactive repair',()=>{const input=samples([0,1,12,1,0]);input[3].breakBefore=true;const repaired=repairRecordedRide(oldRide,input);assert.equal(repaired.samples[2].displayCoordinate,undefined);assert.equal(repaired.summary.trace?.length,2);assert.ok(repaired.summary.meters>10);});
import {LiveRecordedPath} from '../src/core/recordedPath';
test('live trace straightens small jitter without changing raw samples, and retains detours/gaps',()=>{
 const smooth=new LiveRecordedPath(),input=samples([0,1,-1,2,0]);let trace:number[][][]=[];
 for(const sample of input)trace=smooth.next(sample);
 assert.equal(trace[0][2][1],45);assert.equal(input[2].displayCoordinate,undefined);
 const detour=samples([0,1,12,1,0]).map(s=>({...s,fix:{...s.fix,timestamp:s.fix.timestamp+30000},pathFix:{...s.pathFix!,timestamp:s.fix.timestamp+30000}}));detour[0].breakBefore=true;
 for(const sample of detour)trace=smooth.next(sample);
 assert.equal(trace.length,2);assert.equal(trace[1][2][1],detour[2].fix.coordinate[1]);
});
test('live cleanup preserves window anchors and stays bounded on longer trips',()=>{
 const smoother=new LiveRecordedPath(),input=samples(Array.from({length:40},(_,i)=>i%2?1:-1));let trace:number[][][]=[];
 for(const sample of input)trace=smoother.next(sample);
 assert.equal(trace[0].length,40);assert.deepEqual(trace[0].at(-1),input.at(-1)!.fix.coordinate);assert.deepEqual(trace[0][0],input[0].fix.coordinate);
});
