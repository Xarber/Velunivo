import test from 'node:test';
import assert from 'node:assert/strict';
import {activityExtras} from '../src/core/activityTelemetry';
import {defaultBluetoothPreferences} from '../src/bluetooth/preferences';
import {BridgeSnapshot} from '../src/bluetooth/types';
import {getHostPresence,setHostPresence,subscribeHostPresence} from '../src/sharing/hostPresence';
const now=100000;
const snapshot:BridgeSnapshot={state:'connected',vehicleId:'private-vehicle',message:'',extensions:{},fields:{batteryPercent:{value:76,source:'vehicle',timestamp:now,unit:'%'}}};
const extras=(s=snapshot,p=defaultBluetoothPreferences,id='private-vehicle',at=now)=>activityExtras(s,p,id,{sharing:true,viewers:2},at);
test('activity battery only uses the selected connected vehicle and fresh visible telemetry',()=>{
 assert.equal(extras().batteryPercent,76);assert.equal(extras({...snapshot,state:'disconnected'}).batteryPercent,undefined);
 assert.equal(extras(snapshot,defaultBluetoothPreferences,'another').batteryPercent,undefined);
 assert.equal(extras(snapshot,defaultBluetoothPreferences,'sharing-scooter').batteryPercent,undefined);
 assert.equal(extras(snapshot,defaultBluetoothPreferences,'private-vehicle',now+30001).batteryPercent,undefined);
 assert.equal(extras(snapshot,{...defaultBluetoothPreferences,visible:{batteryPercent:false}}).batteryPercent,undefined);
 for(const value of [NaN,-1,101,'unknown'])assert.equal(extras({...snapshot,fields:{batteryPercent:{...snapshot.fields.batteryPercent!,value}}}).batteryPercent,undefined);
 assert.equal(extras({...snapshot,fields:{}}).batteryPercent,undefined);
});
test('activity battery has valid zero, threshold colors and only positively confirmed fresh charging',()=>{
 for(const [value,color] of [[0,'#D75451'],[19,'#D75451'],[20,'#E49235'],[39,'#E49235'],[40,'#28DAB0'],[100,'#28DAB0']] as const){const result=extras({...snapshot,fields:{batteryPercent:{...snapshot.fields.batteryPercent!,value}}});assert.equal(result.batteryPercent,value);assert.equal(result.batteryColor,color);}
 const charging={...snapshot,fields:{...snapshot.fields,charging:{value:true,source:'vehicle' as const,timestamp:now,unit:'boolean' as const}}};
 assert.equal(extras(charging).batterySymbol,'battery.100percent.bolt');
 assert.notEqual(extras(charging,{...defaultBluetoothPreferences,visible:{charging:false}}).batterySymbol,'battery.100percent.bolt');
 assert.notEqual(extras({...charging,fields:{...charging.fields,charging:{...charging.fields.charging,timestamp:now-30001}}}).batterySymbol,'battery.100percent.bolt');
 assert.equal(extras({...snapshot,simulated:true,fields:{batteryPercent:{...snapshot.fields.batteryPercent!,source:'simulator'}}}).batteryPercent,76);
});
test('activity viewer count is local to active sharing, including zero; stop revokes the shared snapshot',()=>{
 assert.equal(extras().viewerCount,2);assert.equal(activityExtras(snapshot,defaultBluetoothPreferences,'private-vehicle',{sharing:false,viewers:2},now).viewerCount,undefined);
 let calls=0;const unsub=subscribeHostPresence(()=>calls++);setHostPresence(true,0);assert.equal(getHostPresence().viewers,0);setHostPresence(true,0);assert.equal(calls,1);setHostPresence(true,3);setHostPresence(false,3);assert.deepEqual(getHostPresence(),{sharing:false,viewers:0});unsub();
});
