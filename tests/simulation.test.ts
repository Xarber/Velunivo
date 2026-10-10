import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as geo from '../src/core/geo';
import * as navigation from '../src/core/navigation';
import * as rideView from '../src/core/rideView';
import { createVehicle } from '../src/core/vehicles';
import { defaultNavigationOptions, Route } from '../src/core/types';
import { rideActivity } from '../src/core/liveActivity';

// Run the real subscription effect with controlled time/native boundaries.
// This catches dropped speech/activity delivery and accidental recording/GPS acquisition.
test('simulated fixes drive voice and activity while recording and real GPS stay untouched', async () => {
  let now=Date.now(), tick: (()=>void)|undefined, appChange: ((state:string)=>void)|undefined;
  let recordings=0, gpsRequests=0, pausedActivities=0, spoken=0, stopped=false;
  const updates: unknown[][]=[], effects:(()=>void)[]=[];
  const mocks: Record<string,unknown>={
    react:{useState:(initial:unknown)=>[initial==='idle'?'simulation':initial,()=>{}],useRef:(initial:unknown)=>({current:initial}),useEffect:(fn:()=>void)=>effects.push(fn)},
    'react-native':{Platform:{OS:'ios'},AppState:{currentState:'active',addEventListener:(_name:string,fn:(state:string)=>void)=>{appChange=fn;return{remove(){}};}}},
    'expo-location':{requestForegroundPermissionsAsync:async()=>{gpsRequests++;return{status:'denied'};}},
    './backgroundLocation':{beginBackgroundLocation:async()=>{gpsRequests++;throw new Error('Simulation must not acquire background GPS');}},
    './directionsVoice':{speakDirection:async()=>{spoken++;},stopDirections:async()=>{}},
    './useNavigationActivity':{updateRideActivity:async(...args:unknown[])=>{updates.push(args);},markActivityPaused:async()=>{pausedActivities++;}},
    '../core/rideView':rideView,'../core/navigation':navigation,'../core/geo':geo,
  };
  class Clock extends Date {static now(){return now;}}
  const context={exports:{},require:(name:string)=>{if(!(name in mocks))throw new Error(name);return mocks[name];},Date:Clock,setInterval:(fn:()=>void)=>{tick=fn;return 1;},clearInterval:()=>{stopped=true;},console};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/useRide.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
  const route={id:'test',coordinates:[[9,45],[9.003,45]],steps:[{index:1,text:'Turn right',sign:2}],distance:236,segments:[],details:{},name:'Test'} as unknown as Route;
  const api=context.exports as {useRide: (...args:unknown[])=>unknown};
  api.useRide(route,createVehicle('escooter','test'),{...defaultNavigationOptions,voice:true},()=>{recordings++;});
  const cleanups=effects.map(fn=>fn()).filter(fn=>typeof fn==='function') as unknown as (()=>void)[];
  const settle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};await settle();
  assert.ok(tick);assert.ok(appChange);assert.ok(updates.length);
  appChange!('background');now+=20000;tick!();await settle();
  assert.ok(spoken>0,'simulation must speak an upcoming turn');
  assert.ok(updates.length>=2,'background callback must renew the activity while JS runs');
  assert.ok(updates.every(args=>args[5]===true),'activity must identify synthetic navigation');
  assert.equal(pausedActivities,0);assert.equal(recordings,0);assert.equal(gpsRequests,0);
  now+=40000;tick!();await settle();assert.equal(stopped,true,'arrival stops the simulator');
  for(const cleanup of cleanups)cleanup();
});

test('simulated Live Activity remains clearly labelled with normal navigation metrics',()=>{
  const route={coordinates:[[9,45],[9.003,45]],steps:[],segments:[],details:{},distance:236} as unknown as Route;
  const fix={coordinate:[9,45] as [number,number],accuracy:3,speed:5,timestamp:Date.now()};
  const g=navigation.guidance(route,fix),vehicle=createVehicle('escooter','test');
  const real=rideActivity(route,vehicle,defaultNavigationOptions,g,fix);
  const simulated=rideActivity(route,vehicle,defaultNavigationOptions,g,fix,true);
  assert.equal(simulated.turn,`Simulation · ${real.turn}`);
  assert.equal(simulated.arrival,real.arrival);assert.equal(simulated.remaining,real.remaining);assert.equal(simulated.minutes,real.minutes);
});
