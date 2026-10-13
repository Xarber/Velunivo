import test from 'node:test';import assert from 'node:assert/strict';
import {requestGroupNavigation,takeGroupNavigation,subscribeGroupNavigation} from '../src/groups/navigationRequest';
import {setGroupActivityCount,getGroupActivityCount} from '../src/groups/activityPresence';
test('group route auto-start waits for the selected route and is consumed only once',()=>{
 let notified=0;const stop=subscribeGroupNavigation(()=>notified++);requestGroupNavigation('new-route');assert.equal(notified,1);assert.equal(takeGroupNavigation('old-route'),false);assert.equal(takeGroupNavigation('new-route'),true);assert.equal(takeGroupNavigation('new-route'),false);stop();
});
test('group activity presence is separate from spectator counts and clears on leaving',()=>{setGroupActivityCount(3);assert.equal(getGroupActivityCount(),3);setGroupActivityCount(undefined);assert.equal(getGroupActivityCount(),undefined);});

import {requestRecordingStart,consumeRecordingStart,subscribeRecordingStart} from '../src/services/recordingStartRequest';
test('recording start requests reach mounted dashboards and remain single-use',()=>{let notifications=0;const stop=subscribeRecordingStart(()=>notifications++);requestRecordingStart();assert.equal(notifications,1);assert.equal(consumeRecordingStart(),true);assert.equal(consumeRecordingStart(),false);stop();});
