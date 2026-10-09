import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeShape, fromValhalla, valhallaRequest, valhallaAttributesRequest } from '../src/core/valhalla';
const shape = '??gEgE'; // two polyline6 points, [0,0] to [.0001,.0001]
const route = { trip: { legs: [{ shape, maneuvers: [{ type: 15, instruction: 'Turn left', begin_shape_index: 0, length: .01 }] }] } };
const attributes = { shape, edges: [{ begin_shape_index: 0, end_shape_index: 1, speed_limit: 30, use: 'road', road_class: 'residential', surface: 'paved' }] };
test('Valhalla polyline6 and road limits align with maneuver and geometry indexes', () => {
  assert.deepEqual(decodeShape(shape), [[0, 0], [.0001, .0001]]);
  const r = fromValhalla(route, attributes, 'bike', 25); assert.equal(r.steps[0].sign, -2); assert.deepEqual(r.details.max_speed, [[0,1,30]]); assert.equal(r.plannedCap,25);
  assert.throws(() => decodeShape('?')); assert.deepEqual(fromValhalla(route, { ...attributes, shape: 'different' }, 'car',25).details, {});
});
test('Valhalla preserves flagged routes and discards unchecked road details', () => {
  for (const patch of [{road_class:'motorway'},{road_class:'trunk'},{use:'ferry'},{use:'steps'},{speed_limit:80},{speed_limit:255}]) { const r = fromValhalla(route,{shape,edges:[{...attributes.edges[0],...patch}]},'car',25); assert.ok(r.safetyWarnings?.length); assert.ok(r.warnings.includes(r.safetyWarnings[0])); assert.equal(r.coordinates.length, 2); }
  assert.deepEqual(fromValhalla(route, { shape, edges: [{ ...attributes.edges[0], end_shape_index: 0 }] }, 'car', 25).details, {});
  const r=fromValhalla(route,{shape,edges:[{...attributes.edges[0],speed_limit:0}]},'bike',25);assert.deepEqual(r.details.max_speed,[]);assert.ok(r.warnings.some(w=>w.includes('unknown')));
});
test('public routing requests exclude highways/ferries and never use predicted/current traffic', () => {
  const q=valhallaRequest([9,45],[9.1,45.1],'car',{maxSpeed:35,ridingLimit:25});assert.equal(q.costing,'auto');assert.ok('top_speed' in q.costing_options.auto); assert.equal(q.costing_options.auto.top_speed,25);assert.equal(q.costing_options.auto?.exclude_highways,true);assert.deepEqual(q.costing_options.auto?.speed_types,['freeflow']);
  const b=valhallaRequest([9,45],[9.1,45.1],'bike',{maxSpeed:25,ridingLimit:20});assert.equal(b.costing,'bicycle');assert.ok('cycling_speed' in b.costing_options.bicycle); assert.equal(b.costing_options.bicycle.cycling_speed,20);
});

test('snapped destination gaps are disclosed without inventing a connecting path or ETA', () => {
  const r = fromValhalla(route, attributes, 'car',25,[[0,0],[.002,.002]]);assert.ok(r.warnings.some(w=>w.includes('Final access is unverified and not included in ETA')));assert.deepEqual(r.coordinates.at(-1),[.0001,.0001]);
});

// Endpoint rounding can change the encoded string without changing the street.
test('road verification accepts rounding but discards attributes for shifted or reindexed paths', () => {
  const rounded = fromValhalla(route, { ...attributes, shape: 'AAeEeE' }, 'bike', 25);
  assert.equal(rounded.coordinates.length, 2);
  assert.deepEqual(rounded.details.max_speed, [[0, 1, 30]]);
  for (const shape of ['gEgE??', '????gEgE']) {
    const r = fromValhalla(route, { ...attributes, shape }, 'bike', 25);
    assert.deepEqual(r.coordinates, decodeShape(route.trip.legs[0].shape));
    assert.deepEqual(r.details, {});
    assert.ok(r.safetyWarnings?.some(w => w.includes('different path')));
    assert.equal(r.steps[0].text, 'Turn left');
  }
});
test('road attribution inherits bicycle access options and uses guarded matching fallback', () => {
  const q = valhallaRequest([9, 45], [9.1, 45.1], 'bike', { maxSpeed: 25, ridingLimit: 20 });
  const a = valhallaAttributesRequest(shape, q);
  assert.deepEqual(a.costing_options, q.costing_options);
  assert.equal(a.shape_match, 'walk_or_snap');
  assert.ok(!('locations' in a));
  assert.ok(a.filters.attributes.includes('edge.speed_limit'));
});

test('missing road service and invalid maneuvers keep valid geometry with explicit warnings', () => {
  for (const attrs of [null, {}, { verificationError: 'Service timed out' }]) {
    const r = fromValhalla(route, attrs, 'bike', 25);
    assert.deepEqual(r.coordinates, decodeShape(shape)); assert.deepEqual(r.details, {});
    assert.ok(r.safetyWarnings?.some(w => w.includes('unverified')));
  }
  const r = fromValhalla({ trip: { legs: [{ shape, maneuvers: [{ instruction: 'Turn', begin_shape_index: 99 }] }] } }, attributes, 'bike', 25);
  assert.deepEqual(r.steps, []); assert.ok(r.safetyWarnings?.some(w => w.includes('Turn instructions')));
  assert.throws(() => fromValhalla({ trip: { legs: [{ shape: '?' }] } }, null, 'bike', 25));
});
