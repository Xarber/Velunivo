import test from 'node:test';
import assert from 'node:assert/strict';
import {cumulative,routeLengths,routeBounds,project,pointAt} from '../src/core/geo';
import {ViewportRequests} from '../src/core/viewportRequests';
import {createRideArchive} from '../src/core/rideArchive';
import {performanceWindows} from '../src/core/vehiclePerformance';
import type {Coord} from '../src/core/types';
import type {RecordedRide,RideSample} from '../src/core/recordings';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('cached navigation geometry preserves projection and interpolation, including loops and duplicate points',()=>{
 const points:Coord[]=Array.from({length:10000},(_,i)=>[12+Math.sin(i/100)*.01,42+i*.00001]);points.splice(100,0,points[99]);
 const lengths=routeLengths(points);assert.equal(routeLengths(points),lengths);assert.deepEqual(lengths,cumulative(points));
 for(const previous of [undefined,0,1000,3000,lengths.at(-1)!])for(const coordinate of [points[50],points[1000],points.at(-1)!]){
  // Original exhaustive window scan is the reference, not the optimized implementation.
  const original=exhaustive(coordinate,points,lengths,previous);assert.deepEqual(project(coordinate,points,previous,lengths),original);
 }
 for(const along of [-1,0,1000,lengths.at(-1)!,lengths.at(-1)!+1]){
  let expected=points.at(-1)!;for(let i=1;i<points.length;i++)if(lengths[i]>=along){const t=(along-lengths[i-1])/(lengths[i]-lengths[i-1]||1);expected=[points[i-1][0]+(points[i][0]-points[i-1][0])*t,points[i-1][1]+(points[i][1]-points[i-1][1])*t];break;}assert.deepEqual(pointAt(points,along,lengths),expected);
 }
 const mutable:Coord[]=[[0,0],[.01,0]];const before=cumulative(mutable);mutable.push([.02,0]);assert.equal(cumulative(mutable).length,before.length+1);
 assert.deepEqual(routeBounds(Array.from({length:200000},(_,i)=>[i*.0001,i*.0002] as Coord)),[0,0,19.9999,39.9998]);
});
function exhaustive(fix:Coord,points:Coord[],lengths:number[],previous?:number){const sx=111320*Math.cos(fix[1]*Math.PI/180),sy=111320;let best={crossTrack:Infinity,along:0,index:0,coordinate:points[0] as number[]};for(let i=0;i<points.length-1;i++){if(previous!==undefined&&(lengths[i+1]<previous-80||lengths[i]>previous+500))continue;const ax=(points[i][0]-fix[0])*sx,ay=(points[i][1]-fix[1])*sy,dx=(points[i+1][0]-points[i][0])*sx,dy=(points[i+1][1]-points[i][1])*sy,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1))),crossTrack=Math.hypot(ax+t*dx,ay+t*dy);if(crossTrack<best.crossTrack)best={crossTrack,along:lengths[i]+t*(lengths[i+1]-lengths[i]),index:i,coordinate:[points[i][0]+t*(points[i+1][0]-points[i][0]),points[i][1]+t*(points[i+1][1]-points[i][1])]};}return {...best,total:lengths.at(-1)??0};}
test('viewport requests share active work, cancel unused work and cap cached geometry by weight',async()=>{
 let active=0,peak=0;const starts:string[]=[],finish=new Map<string,()=>void>();
 const pool=new ViewportRequests<string>((key,signal)=>new Promise((resolve,reject)=>{active++;peak=Math.max(peak,active);starts.push(key);const done=()=>{active--;resolve(key);};finish.set(key,done);signal.addEventListener('abort',()=>{active--;reject(new Error('aborted'));},{once:true});}),()=>2,4,1);
 const a=pool.acquire('a'),same=pool.acquire('a'),b=pool.acquire('b');await tick();assert.deepEqual(starts,['a']);a.release();assert.equal(active,1);finish.get('a')!();assert.equal(await same.promise,'a');await tick();assert.deepEqual(starts,['a','b']);finish.get('b')!();await b.promise;await tick();
 const c=pool.acquire('c');await tick();finish.get('c')!();await c.promise;await tick();const bCached=pool.acquire('b');assert.equal(await bCached.promise,'b');const evicted=pool.acquire('a');const failure=assert.rejects(evicted.promise,/cancelled/);evicted.release();await failure;await tick();assert.equal(peak,1);
 const running=pool.acquire('d');await tick();const rejected=assert.rejects(running.promise,/cancelled/);running.release();await rejected;await tick();assert.equal(active,0);
});
test('a damaged ride summary does not hide other records or overwrite the damaged record',async()=>{
 const valid={id:'good',vehicle:{id:'v'},preview:[],chunks:0,status:'finished',energyAnalysisVersion:2,pathCleanupVersion:2,reliability:{schema:1}};
 const values=new Map<string,string>([['ride-history-ids-v1','["broken","good"]'],['ride-summary-v1:broken','{broken'],['ride-summary-v1:good',JSON.stringify(valid)]]);
 const storage={getItem:async(k:string)=>values.get(k)??null,setItem:async(k:string,v:string)=>{values.set(k,v);},multiGet:async(keys:string[])=>keys.map(k=>[k,values.get(k)??null] as const),multiSet:async(entries:[string,string][])=>{for(const [k,v]of entries)values.set(k,v);},multiRemove:async(keys:string[])=>{keys.forEach(k=>values.delete(k));}};
 const archive=createRideArchive(storage);assert.deepEqual((await archive.recordedRides()).map(r=>r.id),['good']);assert.equal(values.get('ride-summary-v1:broken'),'{broken');const first=(await archive.recordedRides())[0];assert.equal((await archive.recordedRides())[0],first);
});
test('performance windows can grow until altitude uncertainty becomes sufficiently small',()=>{
 const ride={id:'r',vehicle:{id:'v',maxSpeed:25,ridingLimit:25}} as RecordedRide;
 const samples:RideSample[]=Array.from({length:17},(_,i)=>{const timestamp=100000+i*5000,reading=(value:number|string,unit:string)=>({value,unit,source:'vehicle' as const,timestamp});return {fix:{coordinate:[12+i*.0006,42],timestamp,speed:6,accuracy:2,altitude:10,altitudeAccuracy:3},bluetooth:{vehicleId:'v',pluginId:'test',simulated:false,state:'connected',timestamp,fields:{speed:reading(6,'m/s'),batteryPercent:reading(80,'%'),voltage:reading(37,'V'),ridingMode:reading('Drive','text')}}} as RideSample;});assert(performanceWindows(ride,samples).length>0);
});
import {segmentDetails} from '../src/core/routeDetails';
import {estimate} from '../src/core/eta';
import {defaultProfile,Route} from '../src/core/types';
test('indexed road details preserve first interval semantics and scooter ETA at every segment',()=>{
 const route={id:'fixture',name:'Fixture',kind:'bike',source:'valhalla',warnings:[],coordinates:Array.from({length:10000},(_,i)=>[12+i*.00001,42]),details:{average_speed:Array.from({length:9999},(_,i)=>[i,i+1,i%3===0?10:20]),max_speed:[[1,7,15],[3,9,25]],surface:[[4.5,10.5,'GRAVEL']],road_class:[[20,25,'LIVING_STREET']]},steps:[]} as Route;
 for(const key of Object.keys(route.details)){const values=segmentDetails(route,key);for(let i=0;i<values.length;i++)assert.equal(values[i],route.details[key].find(([a,b])=>i>=a&&i<b)?.[2]);assert.equal(segmentDetails(route,key),values);}
 const lengths=cumulative(route.coordinates),profile={...defaultProfile,maxSpeed:25,ridingLimit:25,cruiseFactor:.8};let expected=0;for(let i=0;i<route.coordinates.length-1;i++){const value=(key:string)=>route.details[key]?.find(([a,b])=>i>=a&&i<b)?.[2],speed=Number(value('average_speed')),limit=Number(value('max_speed')),road=value('road_class'),surface=value('surface'),context=road==='LIVING_STREET'?10:Infinity,rough=surface==='GRAVEL'?12:Infinity;expected+=(lengths[i+1]-lengths[i])/(Math.max(1,Math.min(20,speed>0?speed:Infinity,limit>0?limit:Infinity,context,rough))/3.6);}assert.equal(estimate(route,profile).seconds,expected);
});
import {ScratchReplay} from '../src/core/scratchReplay';
import {emptyScratch,scratchCell,visitScratch,scratchGeometry} from '../src/core/scratchMap';
import {cellToLatLng} from 'h3-js';
test('scratch replay reveals original GPS cells, preserves history, supports seeking and ignores bad fixes',async()=>{
 const at=100000,center=(coordinate:Coord):Coord=>{const [lat,lon]=cellToLatLng(scratchCell(coordinate));return [lon,lat];},a=center([12,42]),b=center([12.005,42]),prior=center([11.99,42]),bad=center([12.01,42]);
 const ride={id:'r',startedAt:at} as RecordedRide,fix=(coordinate:Coord,timestamp:number,accuracy=2)=>({coordinate,timestamp,accuracy,speed:5}),samples=[{fix:fix(a,at),displayCoordinate:prior,pathFix:fix(prior,at)},{fix:fix(b,at+40000),displayCoordinate:prior,pathFix:fix(prior,at+40000)},{fix:fix(bad,at+50000,200)}] as RideSample[];
 let index=visitScratch(emptyScratch(),prior,at-10000).index;index=visitScratch(index,a,at).index;index=visitScratch(index,b,at+40000).index;const original=JSON.stringify(index),replay=await ScratchReplay.create(ride,samples,index);
 const first=replay.seek(0);assert(first.index.tiles[scratchCell(a)]);assert(first.index.tiles[scratchCell(prior)]);assert(!first.index.tiles[scratchCell(b)]);assert.equal(replay.seek(1000),first);
 const later=replay.seek(50000);assert(later.index.tiles[scratchCell(b)]);assert(!later.index.tiles[scratchCell(bad)]);assert.deepEqual(later.highlight,[scratchCell(b)]);assert(scratchGeometry(later.index,[11.98,41.99,12.02,42.01],later.highlight).features.some(f=>f.properties.highlight));
 const back=replay.seek(0);assert(!back.index.tiles[scratchCell(b)]);assert.equal(JSON.stringify(index),original);await assert.rejects(ScratchReplay.create(ride,samples,index,()=>false),/cancelled/);
});
