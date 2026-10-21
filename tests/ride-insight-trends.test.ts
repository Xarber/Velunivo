import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rideInsightTrends} from '../src/core/rideInsightTrends';
import {RecordedRide} from '../src/core/recordings';
const ride={id:'test',name:'Test',vehicle:{id:'a',name:'A',kind:'escooter',maxSpeed:25,ridingLimit:20},startedAt:100000,endedAt:700000,status:'finished',samples:20,meters:2000,preview:[],chunks:1,startLabel:'A',endLabel:'B'} as RecordedRide;
test('ride trends sort dates, respect vehicles and calculate stop-inclusive pace',()=>{
 const input=[{...ride,startedAt:900000,endedAt:1500000,batteryUsagePercent:0},{...ride,vehicle:{...ride.vehicle,id:'b'},batteryUsagePercent:12},ride];const result=rideInsightTrends(input,'a');assert.equal(result.length,2);assert.equal(result[0].speedKmh,12);assert.equal(result[0].distanceKm,2);assert.equal(result[0].durationMinutes,10);assert.equal(result[1].battery,0);assert.equal(input[0].startedAt,900000);
});
test('ride trends omit missing battery and reject incomplete or invalid rides',()=>{
 assert.equal(rideInsightTrends([ride])[0].battery,undefined);
 for(const change of [{endedAt:undefined},{status:'recording'},{samples:1},{meters:NaN},{endedAt:1}])assert.equal(rideInsightTrends([{...ride,...change} as RecordedRide]).length,0);
 assert.equal(rideInsightTrends([{...ride,batteryUsagePercent:120}])[0].battery,undefined);
});
