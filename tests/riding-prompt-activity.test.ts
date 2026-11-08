import test from 'node:test';
import assert from 'node:assert/strict';
import {ridingPromptProps} from '../src/core/ridingPrompt';
import type {BridgeSnapshot} from '../src/bluetooth/types';
const now=1800000000000;
const snapshot:BridgeSnapshot={state:'connected',vehicleId:'scooter',pluginId:'xiaomi-m365-v1',message:'',capabilities:{commands:['lock'],metrics:[]} as any,extensions:{locked:{value:false,unit:'boolean',source:'vehicle',timestamp:now}},fields:{speed:{value:0,unit:'m/s',source:'vehicle',timestamp:now}}};
test('prompt lock requires a real supported connection and known lock state; moving disables the action',()=>{assert.equal(ridingPromptProps(snapshot,'scooter',now).promptLockTarget,'ride-prompt:lock:scooter');assert.equal(ridingPromptProps(snapshot,'scooter',now).promptLockEnabled,true);const moving={...snapshot,fields:{speed:{...snapshot.fields.speed!,value:4}}};assert.equal(ridingPromptProps(moving,'scooter',now).promptLockEnabled,false);for(const modified of [{...snapshot,state:'disconnected' as const},{...snapshot,simulated:true},{...snapshot,extensions:{}},{...snapshot,pluginId:'unknown'}])assert.equal(ridingPromptProps(modified,'scooter',now).promptLockTarget,undefined);assert.equal(ridingPromptProps(snapshot,'other',now).promptLockTarget,undefined);assert.equal(ridingPromptProps(snapshot,'scooter',now+12000).promptLockTarget,undefined);});
