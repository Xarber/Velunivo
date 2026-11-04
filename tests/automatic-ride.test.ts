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
