import test from 'node:test';import assert from 'node:assert/strict';
import {registerRideActivity,prepareGroupActivityReplacement,isReplacingGroupActivity,hasRideActivity,cancelGroupActivityReplacement} from '../src/groups/activityReplacement';
for(const from of ['navigation','recording'])for(const to of ['navigation','recording'])test(`${from} to group ${to} saves before stopping and keeps membership during handoff`,async()=>{
 const order:string[]=[];let saved!:()=>void;const write=new Promise<void>(resolve=>{saved=resolve;});
 const stop=registerRideActivity(async()=>{order.push('save');await write;order.push('stop');return true;});
 const transition=prepareGroupActivityReplacement();assert(hasRideActivity());assert(isReplacingGroupActivity());assert.deepEqual(order,['save']);assert.equal(await prepareGroupActivityReplacement(),false);
 saved();await Promise.resolve();stop();assert.equal(await transition,true);assert.deepEqual(order,['save','stop']);assert(isReplacingGroupActivity());assert(!hasRideActivity());
 const next=registerRideActivity(async()=>true);assert(!isReplacingGroupActivity());next();
});
test('save failure preserves the outgoing activity and prevents replacement',async()=>{const stop=registerRideActivity(async()=>false);assert.equal(await prepareGroupActivityReplacement(),false);assert(hasRideActivity());assert(!isReplacingGroupActivity());stop();});
test('joining from idle is allowed but group creation still needs an activity',async()=>{assert(!hasRideActivity());assert.equal(await prepareGroupActivityReplacement(),true);assert(isReplacingGroupActivity());cancelGroupActivityReplacement();assert(!isReplacingGroupActivity());});
test('replacement waits for React session teardown after storage is saved',async()=>{let complete=false;const stop=registerRideActivity(async()=>true);const transition=prepareGroupActivityReplacement().then(ok=>{complete=ok;});await Promise.resolve();assert(!complete);stop();await transition;assert(complete);cancelGroupActivityReplacement();});
