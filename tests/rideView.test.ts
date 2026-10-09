import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrivalTime, bearing, displaySpeed, distanceLeft, forwardHeading, freshFix, roadSpeedLimit, smoothHeading } from '../src/core/rideView';
import { Fix, Route } from '../src/core/types';
const route: Route = { id: 'view', name: 'View', kind: 'bike', coordinates: [[9,45],[9.01,45],[9.01,45.01]], steps: [], source: 'graphhopper', warnings: [], details: { max_speed: [[0,1,30],[1,2,0]] } };
const fix: Fix = { coordinate: [9,45], accuracy: 5, speed: 2, heading: 120, timestamp: 100000 };
test('compass smoothing takes the short turn across north', () => {
  assert.ok(smoothHeading(359,1,.5) < .01); assert.equal(smoothHeading(null,-10),350); assert.equal(smoothHeading(10,350,.5),0);
});
test('route bearing faces forward when stationary and GPS course is preferred while moving', () => {
  assert.ok(Math.abs(bearing([9,45],[9.01,45])! - 90) < .1); assert.equal(bearing([0,0],[0,0]),null);
  assert.deepEqual(forwardHeading(route,0,fix), { heading: 120, source: 'GPS direction' });
  assert.ok(Math.abs(forwardHeading(route,0,{...fix,speed:0}).heading - 90) < .1);
  assert.equal(forwardHeading(route,1,{...fix,heading:undefined}).heading,0);
});
test('unknown road limits are never invented from vehicle caps and intervals are half-open', () => {
  assert.equal(roadSpeedLimit(route,0),30); assert.equal(roadSpeedLimit(route,1),null); assert.equal(roadSpeedLimit(route,undefined),null);
  assert.equal(roadSpeedLimit({...route,details:{max_speed:[[0,2,'unknown']]}},0),null);
});
test('stale or imprecise GPS fixes do not present a live speed', () => {
  assert.equal(freshFix(fix,110000),true); assert.equal(freshFix(fix,120000),false); assert.equal(freshFix({...fix,accuracy:80},100000),false);
});
test('miles and mph convert independently of ETA and overnight arrival includes a date', () => {
  assert.equal(displaySpeed(16.09344,'mi'),10); assert.equal(distanceLeft(1609.344,'mi'),'1.0 mi'); assert.equal(distanceLeft(1000,'km'),'1.0 km');
  const now = new Date(2026,9,9,23,55).getTime(); assert.ok(arrivalTime(600,now).includes(new Date(2026,9,10).toLocaleDateString([], {month:'short',day:'numeric'})));
});
