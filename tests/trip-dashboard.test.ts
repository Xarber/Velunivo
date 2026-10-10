import {test} from 'node:test';
import assert from 'node:assert/strict';
import {versionTap} from '../src/core/developerGate';
import {tripAverage,tripDuration} from '../src/core/tripDashboard';
import {nearbyRoadLimit,numericRoadLimit,NearbyWay} from '../src/core/nearbyRoad';
import {Fix} from '../src/core/types';
test('hidden menu requires three taps strictly under three seconds',()=>{
  let gate=versionTap([],1000);gate=versionTap(gate.taps,2000);assert.equal(gate.revealed,false);assert.equal(versionTap(gate.taps,3999).revealed,true);
  assert.equal(versionTap(gate.taps,4000).revealed,false);assert.equal(versionTap([1000,2000],10000).revealed,false);
});
test('trip time and average include stopped time without inventing ETA',()=>{
  assert.equal(tripDuration(0,3661000),'01:01:01');assert.equal(tripDuration(1000,0),'00:00:00');
  assert.equal(tripAverage(1000,0,360000),10);assert.equal(tripAverage(1000,0,720000),5);assert.equal(tripAverage(0,1000,1000),0);
});
const fix:Fix={coordinate:[0,0],accuracy:5,timestamp:1000,speed:5};
const street=(id:number,lat:number,limit?:string):NearbyWay=>({id,tags:{highway:'residential',...(limit?{maxspeed:limit}:{})},geometry:[{lon:-.001,lat},{lon:.001,lat}]});
test('road indicator supports km/h and mph; ambiguous, untagged and conditional streets stay unknown',()=>{
  assert.equal(numericRoadLimit('30 mph'),48.28032);assert.equal(numericRoadLimit('IT:urban'),null);assert.equal(numericRoadLimit('none'),null);
  assert.equal(nearbyRoadLimit(fix,[street(1,0,'30')]),30);
  assert.equal(nearbyRoadLimit(fix,[street(1,0),street(2,.00015,'50')]),null);
  assert.equal(nearbyRoadLimit(fix,[street(1,0,'30'),street(2,.00003,'50')]),null);
  const conditional=street(1,0,'50');conditional.tags!['maxspeed:conditional']='30 @ wet';assert.equal(nearbyRoadLimit(fix,[conditional]),null);
  assert.equal(nearbyRoadLimit({...fix,accuracy:30},[street(1,0,'30')]),null);
});
