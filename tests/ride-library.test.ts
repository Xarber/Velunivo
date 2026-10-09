import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVehicle, restoreGarage, removeVehicle, sharingVehicle } from '../src/core/vehicles';
import { restorePreferences } from '../src/core/preferences';
import { voiceOptions } from '../src/core/voice';
import { defaultProfile } from '../src/core/types';
import { appendSample, freshVector, RecordedRide, RideSample } from '../src/core/recordings';
import { exportRecordedGPX } from '../src/core/gpx';
import { rideInsights } from '../src/core/rideInsights';
import { coveredByDownload } from '../src/core/downloadCoverage';
import { routeLayers, ROUTE_GRAY, ROUTE_GREEN } from '../src/core/routeLayers';
import { XMLValidator } from 'fast-xml-parser';
test('global preferences migrate the selected vehicle switches, then respect global changes', () => {
  const p = restorePreferences('{"unit":"mi","compass":false}', { ...defaultProfile, voice: false, motion: true });
  assert.equal(p.voice, false); assert.equal(p.motion, true); assert.equal(p.unit, 'mi');
  assert.equal(restorePreferences(JSON.stringify({ ...p, voice: true }), { ...defaultProfile, voice: false }).voice, true);
  assert.equal(voiceOptions({ voice: true, volume: 'quiet' })?.useApplicationAudioSession, false);
  assert.equal(voiceOptions({ voice: true, volume: 'quiet' })?.volume, .35);
  assert.equal(voiceOptions({ voice: true, volume: 'off' }), null);
  assert.equal(voiceOptions({ voice: false, volume: 'loud' }), null);
});
test('sharing preset migrates once and deleted presets stay deleted; older pictures survive switching icons', () => {
  const old = { ...createVehicle('escooter', 'existing'), photo: 'data:image/jpeg;base64,AAA=', photos: ['data:image/jpeg;base64,BBB='] };
  const g = restoreGarage(JSON.stringify({ vehicles: [old], activeId: old.id }), null);
  assert.equal(g.vehicles[1].name, 'Sharing E-Scooter'); assert.equal(sharingVehicle.ridingLimit, 20); assert.equal(sharingVehicle.maxSpeed, 25);
  assert.deepEqual(g.vehicles[0].photos, ['data:image/jpeg;base64,BBB=', old.photo]);
  const deleted = removeVehicle(g, sharingVehicle.id); assert.equal(restoreGarage(JSON.stringify(deleted), null).vehicles.length, 1);
  assert.equal(restoreGarage(JSON.stringify({ ...g, vehicles: [{ ...old, photo: null, photos: g.vehicles[0].photos }] }), null).vehicles[0].photos?.length, 2);
});
const r: RecordedRide = { id: 'ride', name: 'Ride', vehicle: createVehicle('escooter', 'scooter'), startedAt: 1000, endedAt: 61000, status: 'finished', samples: 2, chunks: 1, meters: 200, preview: [], startLabel: 'Start', endLabel: 'End' };
const sample = (timestamp: number, accuracy = 3): RideSample => ({ fix: { coordinate: [9.19, 45.46], speed: 5, accuracy, timestamp }, compass: { heading: 90, timestamp }, accelerometer: { x: 0, y: 0, z: 1, timestamp }, gyroscope: null });
test('records raw fixes without letting poor GPS inflate distance and keeps sample times in GPX', () => {
  const first = sample(1000), bad = sample(2000, 999); bad.fix.coordinate = [10, 46];
  assert.equal(appendSample(r, bad, first.fix).meters, 200);
  assert.equal(freshVector(first.accelerometer, 5000), null);
  const xml = exportRecordedGPX([first, bad, sample(30000)]); assert.equal(XMLValidator.validate(xml), true);
  assert.ok(xml.includes('<time>1970-01-01T00:00:01.000Z</time>')); assert.ok(xml.includes('<v:speed>5</v:speed>')); assert.ok(xml.includes('</trkseg><trkseg>')); assert.ok(!xml.includes('lat="46"'));
});
test('insights require three completed rides and use total distance over total elapsed time', () => {
  assert.equal(rideInsights([r, r]), null); const summary = rideInsights([r, { ...r, id: 'two' }, { ...r, id: 'three' }])!;
  assert.equal(summary.meters, 600); assert.equal(summary.overallSpeedKmh, 12); assert.equal(summary.vehicles.length, 1);
  assert.equal(rideInsights([r, r, { ...r, status: 'recording' }]), null);
});
test('offline preference uses completed coverage and otherwise falls back to device maps', () => {
  const pack = { percentage: 100, bounds: [9, 45, 10, 46] as [number, number, number, number] };
  assert.equal(coveredByDownload([pack], [9.2, 45.5]), true);
  assert.equal(coveredByDownload([pack], [9.2, 45.5], [[9.2, 45.5], [11, 45.5]]), false);
  assert.equal(coveredByDownload([{ ...pack, percentage: 99 }], [9.2, 45.5]), false);
});
test('alternative routes render beneath selected, with exact completed/remaining split', () => {
  const a = { id: 'bike', coordinates: [[0, 0], [.001, 0], [.002, 0]] as [number, number][] } as any;
  const b = { ...a, id: 'car' };
  assert.deepEqual(routeLayers([a, b], a).map(l => l.color), [ROUTE_GRAY, ROUTE_GREEN]);
  assert.equal(routeLayers([a, b], b).at(-1)?.id, 'car-selected');
  const paths = routeLayers([a, b], a, 50); assert.deepEqual(paths.map(l => l.color), [ROUTE_GRAY, ROUTE_GRAY, ROUTE_GREEN]);
  assert.deepEqual(paths[1].coordinates.at(-1), paths[2].coordinates[0]); assert.ok(paths[2].coordinates[0][0] > 0);
  assert.equal(routeLayers([a], a, 1000).at(-1)?.color, ROUTE_GRAY);
});

import { createRideArchive } from '../src/core/rideArchive';
test('checkpoint writes survive restart, preserve full chunks, and cannot resurrect deleted rides', async () => {
  const data = new Map<string, string>();
  const storage = { getItem: async (key: string) => data.get(key) || null, setItem: async (key: string, value: string) => { data.set(key, value); }, multiGet: async (keys: string[]) => keys.map(k => [k, data.get(k) || null] as [string, string | null]), multiSet: async (entries: [string, string][]) => { entries.forEach(([k, v]) => data.set(k, v)); }, multiRemove: async (keys: string[]) => { keys.forEach(k => data.delete(k)); } };
  const archive = createRideArchive(storage), running = { ...r, status: 'recording' as const, endedAt: undefined, lastFixAt: 30000, samples: 102, chunks: 2 };
  archive.liveRecording(r.id, true);
  await archive.persistRide(running, [{ index: 0, samples: Array.from({ length: 100 }, (_, i) => sample(1000 + i * 1000)) }, { index: 1, samples: [sample(101000), sample(102000)] }]);
  assert.equal((await archive.recordedRides())[0].status, 'recording');
  const reboot = createRideArchive(storage), recovered = (await reboot.recordedRides())[0]; assert.equal(recovered.status, 'interrupted'); assert.equal(recovered.endedAt, 30000); assert.equal((await reboot.rideSamples(recovered)).length, 102);
  const finishing = archive.persistRide({ ...running, status: 'finished', endedAt: 103000 }, []), deletion = archive.deleteRecordedRide(running);
  await Promise.all([finishing, deletion]); assert.deepEqual(await archive.recordedRides(), []); assert.equal([...data.keys()].some(k => k.startsWith('ride-samples-v1:')), false);
});
