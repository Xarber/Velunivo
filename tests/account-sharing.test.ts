import assert from 'node:assert/strict';
import test from 'node:test';
import { latLngToCell } from 'h3-js';
import { accountArchive } from '../server/accountArchive';
import { sharedAccountData, sharesArchive, updateSharedArchive } from '../server/accountSharing';

test('outgoing sharing uses allowlisted records without detailed exploration traces', () => {
  assert.equal(sharesArchive('recorded-rides'), false);
  assert.equal(sharesArchive('constructor'), false);
  const cell = latLngToCell(41.9, 12.5, 10);
  assert.deepEqual(sharedAccountData('exploration', {
    schema: 1, category: 'exploration', value: {scratch: {tiles: {[cell]: {lastVisited: 1, firstRideId: 'secret'}, invalid: {}}}},
  }), {schema: 1, visitedTiles: 1, resolution: 7, cells: [latLngToCell(41.9, 12.5, 7)]});
  assert.deepEqual(sharedAccountData('saved-places', {schema: 1, category: 'saved-places', value: [
    {id: '1', name: 'Example', address: 'Street', coordinate: [12.5, 41.9], apiKey: 'secret'},
    {id: '2', name: 'Invalid', address: 'Street', coordinate: [181, 41.9]},
  ]}), {schema: 1, places: [{id: '1', name: 'Example', address: 'Street', coordinate: [12.5, 41.9]}]});
  assert.throws(() => sharedAccountData('saved-places', {schema: 2}), {status: 422});
});

test('publishes and removes a private outgoing projection using the owner token and revision', async () => {
  type Entry = { data: unknown; revision: number; public: boolean; shared: boolean };
  const records = new Map<string, Entry>();
  let failNextWrite = false;
  const fetcher: typeof fetch = async (url, init) => {
    const path = new URL(String(url)).pathname;
    const headers = new Headers(init?.headers);
    const entry = records.get(path);
    assert.equal(headers.get('authorization'), 'Bearer owner');
    if (init?.method === 'GET') return entry ? Response.json(entry) : new Response(null, { status: 404 });
    assert.equal(headers.get('if-match'), `"${entry?.revision ?? 0}"`);
    if (init?.method === 'DELETE') {
      records.delete(path);
      return new Response(null, { status: 204 });
    }
    if (failNextWrite) {
      failNextWrite = false;
      return new Response(null, { status: 409 });
    }
    const body = JSON.parse(String(init?.body));
    assert.equal(body.public, false);
    assert.deepEqual(body.readers, []);
    const next = { data: body.data, revision: (entry?.revision ?? 0) + 1, public: false, shared: false };
    records.set(path, next);
    return Response.json(next);
  };
  const issuer = 'https://issuer.example';
  const archive = accountArchive(issuer, 'source', 'owner', 'saved-places', fetcher);
  const publish = () => updateSharedArchive(issuer, 'source', 'owner', 'saved-places', fetcher);
  const key = '/v1/apps/source/data/saved-places/current';
  const value = [{id: '1', name: 'Example', address: 'Street', coordinate: [12.5, 41.9]}];
  await archive.write(0, { schema: 1, category: 'saved-places', value });
  failNextWrite = true;
  await assert.rejects(publish(), { status: 409 });
  await publish();
  await publish();
  assert.deepEqual(records.get(key), { public: false, shared: false, revision: 1, data: { schema: 1, places: value } });
  await archive.remove(1);
  await publish();
  assert.equal(records.has(key), false);
});
