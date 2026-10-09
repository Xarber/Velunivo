import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapsDirectionsUrl } from '../src/core/externalMaps';
import { fromGraphHopper } from '../src/core/routing';
const start: [number, number] = [9.19, 45.4642], end: [number, number] = [8.7281, 45.63];
test('external map links retain both selected endpoints and convert lon/lat exactly', () => {
  for (const provider of ['apple', 'google'] as const) for (const mode of ['bike', 'car'] as const) {
    const url = new URL(mapsDirectionsUrl(provider, start, end, mode));
    assert.equal(url.searchParams.get(provider === 'apple' ? 'source' : 'origin'), '45.4642,9.19');
    assert.equal(url.searchParams.get('destination'), '45.63,8.7281');
    assert.equal(url.searchParams.get(provider === 'apple' ? 'mode' : 'travelmode'), mode === 'car' ? 'driving' : provider === 'apple' ? 'cycling' : 'bicycling');
    assert.ok(url.searchParams.get('avoid'));
    if (provider === 'google') { assert.equal(url.searchParams.get('api'), '1'); assert.equal(url.searchParams.get('dir_action'), 'navigate'); }
  }
  assert.equal(new URL(mapsDirectionsUrl('google', [-122.393624, 37.795442], [0, 0])).searchParams.get('origin'), '37.795442,-122.393624');
});
test('external map links reject invalid or unresolved locations', () => {
  for (const point of [[NaN, 1], [1, Infinity], [181, 0], [0, 91]] as [number, number][]) {
    assert.throws(() => mapsDirectionsUrl('apple', point, end));
    assert.throws(() => mapsDirectionsUrl('google', start, point));
  }
});
test('GraphHopper retains valid original geometry when metadata cannot support guidance', () => {
  const path = { points: { coordinates: [start, end] }, details: { max_speed: [[0, 99, 80]] }, instructions: [{ text: 'Bad', sign: 1, interval: [99, 100] }] };
  const r = fromGraphHopper(path, 'bike');
  assert.deepEqual(r.coordinates, [start, end]); assert.deepEqual(r.details, {}); assert.deepEqual(r.steps, []);
  assert.equal(r.safetyWarnings?.length, 2);
  assert.throws(() => fromGraphHopper({ ...path, points: { coordinates: [] } }, 'bike'));
});
