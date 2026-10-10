import test from 'node:test';
import assert from 'node:assert/strict';
import { learnedBatteryRange, pendingBatteryRide, validBatteryUsage } from '../src/core/batteryLearning';
import { createRideArchive } from '../src/core/rideArchive';
import { RecordedRide } from '../src/core/recordings';
import { batteryEstimate, createVehicle } from '../src/core/vehicles';
import { restorePreferences } from '../src/core/preferences';
const vehicle=createVehicle('escooter','test');
const ride=(id:string,meters=8000,percent=20):RecordedRide=>({id,vehicle,name:'Trip',startLabel:'Start',endLabel:'Arrival',startedAt:1,endedAt:1001,status:'finished',samples:2,chunks:0,meters,preview:[],batteryFeedback:'answered',batteryUsagePercent:percent});
test('battery learning requires three valid reports from the same vehicle and weights by total consumption',()=>{
 assert.equal(learnedBatteryRange([ride('1'),ride('2')],vehicle),null);
 const records=[ride('1',8000,20),ride('2',4000,10),ride('3',2000,10),{...ride('other',90000,10),vehicle:{...vehicle,id:'other'}},ride('zero',5000,0),ride('tiny',20,10),ride('invalid',8000,NaN)];
 const learned=learnedBatteryRange(records,vehicle)!;assert.equal(learned.count,3);assert.equal(learned.rangeKm,35);
 assert.equal(batteryEstimate(7000,{...vehicle,rangeKm:50,learnedRangeKm:learned.rangeKm})?.percent,20);
 assert.ok(Math.abs(batteryEstimate(7000,{...vehicle,rangeKm:50})!.percent-14)<.00001);
 assert.equal(learnedBatteryRange(records.map(r=>({...r,status:'interrupted'})),vehicle),null);
});
test('battery feedback is opt-in, permits zero usage, and only completed opted-in rides are offered',()=>{
 assert.equal(restorePreferences(null,vehicle).askBatteryUsage,false);
 assert.equal(restorePreferences('{"askBatteryUsage":true}',vehicle).askBatteryUsage,true);
 for(const n of [0,1.5,100])assert.ok(validBatteryUsage(n));for(const n of [-1,101,NaN,Infinity])assert.equal(validBatteryUsage(n),false);
 const pending={...ride('pending'),batteryFeedback:'pending' as const};
 assert.equal(pendingBatteryRide([ride('answered'),{...pending,status:'recording'},pending])?.id,'pending');
 assert.equal(pendingBatteryRide([{...pending,batteryFeedback:'skipped'}]),undefined);
});
test('saving feedback preserves sensor chunks, survives checkpoints/restart, and rejects invalid answers',async()=>{
 const values=new Map<string,string>();const storage={getItem:async(k:string)=>values.get(k)||null,setItem:async(k:string,v:string)=>{values.set(k,v);},multiGet:async(keys:string[])=>keys.map(k=>[k,values.get(k)||null] as const),multiSet:async(entries:[string,string][])=>{entries.forEach(([k,v])=>values.set(k,v));},multiRemove:async(keys:string[])=>{keys.forEach(k=>values.delete(k));}};
 const archive=createRideArchive(storage);let updates=0;const stop=archive.subscribeRides(()=>updates++);
 const pending={...ride('pending'),batteryFeedback:'pending' as const,batteryUsagePercent:undefined,chunks:1};
 const sample={fix:{coordinate:[0,0] as [number,number],accuracy:5,speed:0,timestamp:1},compass:null,accelerometer:null,gyroscope:null};
 await archive.persistRide(pending,[{index:0,samples:[sample]}]);await assert.rejects(archive.saveBatteryUsage(pending.id,101));
 await archive.saveBatteryUsage(pending.id,12.5);await archive.persistRide(pending,[]);
 const reboot=createRideArchive(storage),saved=(await reboot.recordedRides())[0];assert.equal(saved.batteryUsagePercent,12.5);assert.equal(saved.batteryFeedback,'answered');assert.deepEqual(await reboot.rideSamples(saved),[sample]);assert.equal(updates,3);
 await archive.persistRide({...pending,id:'crashed',status:'recording',endedAt:undefined,lastFixAt:5000},[]);await archive.saveBatteryUsage('crashed',5);assert.equal((await archive.recordedRides()).find(r=>r.id==='crashed')?.status,'interrupted');
 await archive.saveBatteryUsage(pending.id,null);assert.equal((await archive.recordedRides()).find(r=>r.id===pending.id)?.batteryFeedback,'skipped');stop();
 await archive.deleteRecordedRide(saved);await assert.rejects(archive.saveBatteryUsage(saved.id,20));
});
