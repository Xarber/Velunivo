import test from 'node:test';
import assert from 'node:assert/strict';
import {AutomaticRideDetector} from '../src/core/automaticRide';
import {BridgeSnapshot} from '../src/bluetooth/types';
const base=1800000000000;
const snapshot=(second:number,change:Partial<BridgeSnapshot>={}):BridgeSnapshot=>({state:'connected',vehicleId:'scooter',message:'',extensions:{},fields:{speed:{value:4,unit:'m/s',source:'vehicle',timestamp:base+second*1000}},...change});
test('automatic recording requires at least ten seconds of fresh real vehicle movement',()=>{
 const d=new AutomaticRideDetector();for(let i=0;i<10;i+=2)assert.equal(d.accept(snapshot(i),'scooter',base+i*1000),false);
 assert.equal(d.accept(snapshot(10),'scooter',base+10000),true);
});
test('simulation, disconnects, mismatched vehicles, GPS and stale values cannot trigger auto recording',()=>{
 for(const change of [{simulated:true},{state:'reconnecting' as const},{vehicleId:'other'},{fields:{speed:{value:4,unit:'m/s' as const,source:'gps' as const,timestamp:base}}}]){
  const d=new AutomaticRideDetector();for(let i=0;i<20;i++)assert.equal(d.accept(snapshot(i,change),'scooter',base+i*1000),false);
 }
 const d=new AutomaticRideDetector();assert.equal(d.accept(snapshot(0),'scooter',base+4000),false);
});
test('stops and sampling gaps reset evidence; repeated packets cannot count twice',()=>{
 const d=new AutomaticRideDetector();for(let i=0;i<8;i+=2)d.accept(snapshot(i),'scooter',base+i*1000);
 const stopped=snapshot(8);stopped.fields.speed!.value=0;assert.equal(d.accept(stopped,'scooter',base+8000),false);
 assert.equal(d.accept(snapshot(10),'scooter',base+10000),false);
 for(let i=0;i<10;i++)assert.equal(d.accept(snapshot(10),'scooter',base+10000),false);
 assert.equal(d.accept(snapshot(18),'scooter',base+18000),false);
});
test('invalid values and future timestamps are rejected',()=>{
 for(const value of [NaN,Infinity,-1,50]){const d=new AutomaticRideDetector(),s=snapshot(0);s.fields.speed!.value=value;assert.equal(d.accept(s,'scooter',base),false);}
 assert.equal(new AutomaticRideDetector().accept(snapshot(10),'scooter',base),false);
});

test('automatic recording consent and wake state never transfer to another device',async()=>{
 const {transferableKey}=await import('../src/core/dataStorage');
 for(const key of ['automatic-ride-consent-v1','automatic-ride-vehicle-v1','automatic-ride-alert-at-v1'])assert.equal(transferableKey(key),false);
});

test('background connection prompts once without treating a stationary connection as movement',async()=>{
 const {AutomaticConnectionAlert}=await import('../src/core/automaticRide');const d=new AutomaticConnectionAlert();const s=snapshot(0,{connectedAt:base});s.fields.speed!.value=0;
 assert.equal(d.accept(s,'scooter',true,false,base),true);assert.equal(d.accept(s,'scooter',true,false,base),false);assert.equal(new AutomaticRideDetector().accept(s,'scooter',base),false);
});
test('backgrounding an existing foreground connection does not create a connection alert',async()=>{
 const {AutomaticConnectionAlert}=await import('../src/core/automaticRide');const d=new AutomaticConnectionAlert();const s=snapshot(0,{connectedAt:base});assert.equal(d.accept(s,'scooter',true,true,base),false);assert.equal(d.accept(s,'scooter',true,false,base),false);
});
test('connection alerts reject revoked consent, stale/simulated readings and the wrong vehicle',async()=>{
 const {AutomaticConnectionAlert}=await import('../src/core/automaticRide');const s=snapshot(0,{connectedAt:base});assert.equal(new AutomaticConnectionAlert().accept(s,'scooter',false,false,base),false);assert.equal(new AutomaticConnectionAlert().accept({...s,simulated:true},'scooter',true,false,base),false);assert.equal(new AutomaticConnectionAlert().accept(s,'other',true,false,base),false);assert.equal(new AutomaticConnectionAlert().accept(s,'scooter',true,false,base+4000),false);
});

test('installed iOS plugin creates a restoration pod and a matching runtime identifier',async()=>{
 const fs=await import('node:fs');const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);
 const config=JSON.parse(fs.readFileSync('app.json','utf8')).expo;const [,options]=config.plugins.find((p:unknown)=>Array.isArray(p)&&p[0]==='@sfourdrinier/react-native-ble-plx');
 assert.equal(options.iosEnableRestoration,true);assert(options.modes.includes('central'));
 const {injectRestorationPodLine,setBlePlxRestoreIdentifier}=require('@sfourdrinier/react-native-ble-plx/plugin/build/withBLERestorationPodfile.js');
 const pod=injectRestorationPodLine("target 'Velunivo' do\n  use_expo_modules!\nend\n",'@sfourdrinier/react-native-ble-plx');assert.match(pod,/Restoration/);
 assert.equal(setBlePlxRestoreIdentifier({},options.iosRestorationIdentifier).BlePlxRestoreIdentifier,'app.velunivo.vehicle-central');
});
