import { test } from 'node:test';
import assert from 'node:assert/strict';
import { batteryEstimate, createVehicle, defaultGarage, rangeKm, rangeValue, removeVehicle, restoreGarage } from '../src/core/vehicles';
import { defaultProfile } from '../src/core/types';
test('fresh installations use a generic 25 km/h scooter with unknown range', () => {
  const g = restoreGarage(null, null); assert.equal(g.vehicles[0].maxSpeed, 25); assert.equal(g.vehicles[0].ridingLimit, 25); assert.equal(g.vehicles[0].rangeKm, null);
});
test('legacy settings migrate without adopting the new default or losing tuning', () => {
  const v = { ...defaultProfile, name: 'Existing scooter', maxSpeed: 35, ridingLimit: 20, motion: true };
  const g = restoreGarage(null, JSON.stringify(v)); assert.equal(g.vehicles[0].name, v.name); assert.equal(g.vehicles[0].maxSpeed, 35); assert.equal(g.vehicles[0].ridingLimit, 20); assert.equal(g.vehicles[0].motion, true);
});
test('garage restoration preserves selection and recovers missing or corrupt entries', () => {
  const bike = { ...createVehicle('ebike', 'bike'), maxSpeed: 45, ridingLimit: 32, rangeKm: 60, rangeUnit: 'mi' as const, icon: '⚡' };
  const g = { sharingPresetAdded: true, vehicles: [...defaultGarage.vehicles, bike], activeId: 'bike' };
  assert.deepEqual(restoreGarage(JSON.stringify(g), null), g);
  assert.equal(restoreGarage(JSON.stringify({ ...g, activeId: 'missing' }), null).activeId, 'default-scooter');
  assert.equal(restoreGarage(JSON.stringify({ vehicles: [{ ...bike, maxSpeed: NaN }], activeId: 'bike' }), null).vehicles[0].maxSpeed, 25);
  assert.equal(restoreGarage('{', null).vehicles.length, 2);
});
test('deleting the current vehicle selects a survivor and cannot delete the last vehicle', () => {
  const single = { ...defaultGarage, vehicles: [defaultGarage.vehicles[0]] }; assert.equal(removeVehicle(single, 'default-scooter'), single);
  const g = { vehicles: [...defaultGarage.vehicles, createVehicle('ebike', 'bike')], activeId: 'bike' };
  const next = removeVehicle(g, 'bike'); assert.equal(next.activeId, 'default-scooter'); assert.equal(next.vehicles.length, 2);
});
test('mile conversion is reversible and battery use remains meaningful beyond full range', () => {
  assert.equal(rangeKm(10, 'mi'), 16.09344); assert.equal(rangeValue(rangeKm(10, 'mi'), 'mi'), 10);
  const bike = { ...createVehicle('ebike'), rangeKm: 40 };
  assert.deepEqual(batteryEstimate(10000, bike), { percent: 25, remainingKm: 30, exceedsRange: false });
  assert.deepEqual(batteryEstimate(50000, bike), { percent: 125, remainingKm: 0, exceedsRange: true });
  assert.equal(batteryEstimate(0, bike)?.percent, 0); assert.equal(batteryEstimate(10, createVehicle('escooter')), null);
});
