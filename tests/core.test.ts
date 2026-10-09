import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultProfile, Route } from '../src/core/types';
import { distance, cumulative, parseCoordinate, project } from '../src/core/geo';
import { estimate } from '../src/core/eta';
import { importGPX, exportGPX } from '../src/core/gpx';
import { guidance } from '../src/core/navigation';
import { fromGraphHopper, routeRequest } from '../src/core/routing';
const track: Route = { id: 'test', name: 'Test', kind: 'track', coordinates: [[9, 45], [9.01, 45], [9.02, 45]], source: 'gpx', steps: [], details: {}, warnings: [] };
test('distance uses the polyline, not endpoint distance', () => {
  assert.ok(Math.abs(distance([0, 0], [0, 1]) - 111195) < 2);
  const loop = cumulative([[0, 0], [.01, 0], [0, 0]]); assert.ok(loop.at(-1)! > 2200);
});
test('ETA respects hardware capability and local cap independently', () => {
  const legal = estimate(track, defaultProfile), fast = estimate(track, { ...defaultProfile, maxSpeed: 35, ridingLimit: 35 });
  assert.equal(legal.cap, 25); assert.equal(fast.cap, 35); assert.ok(fast.seconds < legal.seconds);
  const slow = estimate(track, { ...defaultProfile, maxSpeed: 10 }); assert.equal(slow.cap, 10);
  assert.ok(legal.seconds >= legal.minimumSeconds);
});
test('remaining ETA drops continuously within a segment', () => {
  const all = estimate(track, defaultProfile), rest = estimate(track, defaultProfile, 300);
  assert.ok(Math.abs(all.meters - rest.meters - 300) < .1); assert.ok(rest.seconds < all.seconds);
  assert.equal(estimate(track, defaultProfile, 100000).meters, 0);
});
test('road limits, rough surface and maneuver delays slow the estimate', () => {
  const plain = estimate(track, defaultProfile);
  const slower = { ...track, details: { average_speed: [[0, 2, 8] as [number, number, number]] }, steps: [{ index: 1, sign: 2, text: 'Turn right', distance: 200 }] };
  assert.ok(estimate(slower, defaultProfile).seconds > plain.seconds);
  const rough = { ...track, details: { surface: [[0, 2, 'GRAVEL'] as [number, number, string]] } };
  assert.ok(estimate(rough, defaultProfile).seconds > plain.seconds);
});
test('GPX round trip preserves coordinates without inventing turns', () => {
  const r = importGPX(exportGPX(track.coordinates)); assert.deepEqual(r.coordinates, track.coordinates); assert.equal(r.steps.length, 0);
});
test('GPX rejects disconnected tracks, invalid points and entities', () => {
  assert.throws(() => importGPX('<gpx><trk><trkseg><trkpt lat="1" lon="2"/><trkpt lat="2" lon="3"/></trkseg><trkseg><trkpt lat="5" lon="5"/><trkpt lat="6" lon="6"/></trkseg></trk></gpx>'));
  assert.throws(() => importGPX('<!DOCTYPE gpx><gpx/>'));
  assert.throws(() => importGPX('<gpx><rte><rtept lat="100" lon="2"/><rtept lat="100" lon="3"/></rte></gpx>'));
});
test('coordinate entry uses latitude/longitude but provider uses longitude/latitude', () => {
  assert.deepEqual(parseCoordinate('45.5, 9.2'), [9.2, 45.5]); assert.throws(() => parseCoordinate('45, ')); assert.throws(() => parseCoordinate('91, 0'));
});
test('custom models apply exclusions and cap to both road candidates', () => {
  for (const kind of ['bike', 'car'] as const) { const r = routeRequest([9, 45], [9.01, 45], kind, defaultProfile); assert.equal(r.profile, kind); assert.equal(r.custom_model.speed[0].limit_to, '25'); assert.equal(r['ch.disable'], true); assert.ok(r.custom_model.priority.some(x => x.if.includes('STEPS') && x.multiply_by === '0')); }
});
test('provider geometry is validated and restricted roads stay available with warnings', () => {
  const path = { points: { coordinates: track.coordinates }, details: { road_class: [[0, 2, 'RESIDENTIAL']] }, instructions: [{ text: 'Turn right', sign: 2, interval: [1, 2], distance: 100 }] };
  assert.equal(fromGraphHopper(path, 'bike').steps[0].index, 1);
  assert.ok(fromGraphHopper({ ...path, details: { road_class: [[0, 2, 'MOTORWAY']] } }, 'car').safetyWarnings?.length);
  assert.ok(fromGraphHopper({ ...path, details: { max_speed: [[0, 2, 90]] } }, 'car').safetyWarnings?.some(w => w.includes('90')));
  assert.throws(() => fromGraphHopper({ ...path, points: { coordinates: [[NaN, 0], [1, 1]] } }, 'car'));
});
test('projection finds continuous progress and off-route distance', () => {
  const g = project([9.005, 45], track.coordinates); assert.ok(g.along > 390 && g.along < 395); assert.ok(g.crossTrack < 1);
  assert.ok(project([9.005, 45.01], track.coordinates).crossTrack > 1000);
});
test('navigation rejects poor and stale fixes; arrival requires end proximity', () => {
  const fix = { coordinate: [9.02, 45] as [number, number], accuracy: 5, speed: 1, timestamp: Date.now() };
  assert.ok(guidance(track, fix).arrived);
  assert.equal(guidance(track, { ...fix, accuracy: 80 }).valid, false);
  assert.equal(guidance(track, { ...fix, timestamp: Date.now() - 20000 }).valid, false);
  assert.equal(guidance(track, { ...fix, coordinate: [9.02, 45.01] }).arrived, false);
});

test('GraphHopper GPX prefers its full track over accompanying sparse route waypoints', () => {
  const r = importGPX('<gpx><trk><trkseg><trkpt lat="45" lon="9"/><trkpt lat="45" lon="9.01"/><trkpt lat="45" lon="9.02"/></trkseg></trk><rte><rtept lat="45" lon="9"/><rtept lat="45" lon="9.02"/></rte></gpx>');
  assert.deepEqual(r.coordinates, track.coordinates); assert.deepEqual(r.steps, []);
});
