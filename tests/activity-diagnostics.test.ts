import test from 'node:test';import assert from 'node:assert/strict';
import {activityDiagnosis,ActivityChecks} from '../src/core/activityDiagnostics';
const healthy:ActivityChecks={systemEnabled:true,declaredSupport:true,extensionBundled:true,groupConfigured:true,groupsMatch:true,sharedContainerAvailable:true,layoutStored:true};
test('activity requests do not conceal missing installation prerequisites',()=>{
 for(const [key,pattern] of [['systemEnabled',/iOS currently denies/],['extensionBundled',/missing/],['groupsMatch',/inconsistent/],['sharedContainerAvailable',/Shared widget storage is unavailable/],['layoutStored',/layout is missing/]] as const){
  assert.match(activityDiagnosis({checks:{...healthy,[key]:false},activeCount:1,lastError:''}),pattern);
 }
});
test('active ActivityKit state is never presented as proof of lock screen rendering',()=>{
 assert.match(activityDiagnosis({checks:healthy,activeCount:1,lastError:''}),/does not confirm/);
 assert.match(activityDiagnosis({checks:healthy,activeCount:0,lastError:''}),/no active/);
 assert.match(activityDiagnosis({checks:healthy,activeCount:null,lastError:''}),/visibility is unverified/);
 assert.match(activityDiagnosis({checks:healthy,activeCount:1,lastError:'DeniedBySystem'}),/DeniedBySystem/);
 assert.match(activityDiagnosis({checks:null,activeCount:0,lastError:''}),/latest native build/);
});
test('native renderer tolerates unavailable shared layout but preserves native startup errors',()=>{
 const checks={...healthy,nativeRenderer:true,sharedContainerAvailable:false,layoutStored:false,groupsMatch:false};
 assert.match(activityDiagnosis({checks,activeCount:1,lastError:''}),/directly from ActivityKit data/);
 assert.match(activityDiagnosis({checks,activeCount:1,lastError:''}),/still needs checking/);
 assert.match(activityDiagnosis({checks,activeCount:1,lastError:'RequestDenied'}),/RequestDenied/);
 assert.match(activityDiagnosis({checks:{...checks,extensionBundled:false},activeCount:1,lastError:''}),/missing/);
});
