import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { accountArchive, archiveParts, restoreArchiveParts } from '../server/accountArchive';
import { accountArchiveBytes, archiveEnabled, defaultArchiveBytes, projectAccountArchive, applyAccountArchive } from '../src/core/accountArchive';
import type { AutomaticEnvelope } from '../src/core/automaticSync';

test('small categories default on after consent; large categories stay off unless explicitly enabled', () => {
  assert.equal(archiveEnabled('settings', 100, null, true), true);
  assert.equal(archiveEnabled('settings', 100, null, false), false);
  assert.equal(archiveEnabled('settings', 100, 'off', true), false);
  assert.equal(archiveEnabled('vehicles', defaultArchiveBytes, null, true), false);
  assert.equal(archiveEnabled('recorded-rides', 100, null, true), false);
  assert.equal(archiveEnabled('exploration', 100, null, true), false);
  assert.equal(archiveEnabled('recorded-rides', defaultArchiveBytes + 1, 'on', true), true);
  assert.equal(accountArchiveBytes('è'), 4);
});

test('category projection and restore exclude credentials and preserve unrelated local data', () => {
  const local = {
    backup: { garage: {vehicles: []}, places: [], routes: [], rides: [] },
    settings: { 'navigation.developerMode': { value: true }, language: { value: 'it' } },
    revisions: { 'place:one': { modifiedAt: 1 }, 'ride:one': { modifiedAt: 1 } },
    privateData: { mapKey: 'private' },
  } as unknown as AutomaticEnvelope;
  const outgoing = projectAccountArchive(local, 'settings');
  assert.deepEqual(outgoing.value, { language: { value: 'it' } });
  const incoming = applyAccountArchive(local, {
    schema: 1, category: 'saved-places', value: [{id:'other'}],
    revisions: { 'ride:one': {modifiedAt: 2, deleted:true, hash:'a'.repeat(64)} },
  }, 'saved-places');
  assert.deepEqual(incoming.backup.places, [{id:'other'}]);
  assert.equal(incoming.backup.rides, local.backup.rides);
  assert.equal(incoming.revisions['ride:one'], local.revisions['ride:one']);
  assert.equal(incoming.privateData, undefined);
});

test('private archive commits multi-record snapshots only against the expected revision', async () => {
  const data = { schema: 1, category: 'recorded-rides', value: randomBytes(100_000).toString('hex') };
  const parts = archiveParts(data);
  assert(parts.length > 1);
  assert.deepEqual(restoreArchiveParts(parts), data);
  assert.throws(() => restoreArchiveParts(['!invalid']));
  type Entry = {data: unknown; revision: number; public: boolean; shared: boolean};
  const records = new Map<string, Entry>();
  const fakeFetch: typeof fetch = async (url, init) => {
    const id = String(url).split('/').at(-1)!;
    const entry = records.get(id);
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer test');
    if (init?.method === 'GET') return entry ? Response.json(entry) : new Response(null, {status:404});
    const expected = new Headers(init?.headers).get('if-match');
    if (expected !== `"${entry?.revision ?? 0}"`) return new Response(null, {status:409});
    if (init?.method === 'DELETE') { records.delete(id); return new Response(null, {status:204}); }
    const body = JSON.parse(String(init?.body));
    assert.equal(body.public, false);
    assert.deepEqual(body.readers, []);
    const next = { data: body.data, revision: (entry?.revision ?? 0) + 1, public:false, shared:false };
    records.set(id, next);
    return Response.json(next);
  };
  const repository = accountArchive('https://issuer.example', 'client', 'test', 'recorded-rides', fakeFetch);
  await repository.write(0, data);
  assert.deepEqual(await repository.read(), {revision:1, data});
  await assert.rejects(repository.write(0, {...data,value:'stale'}), {status:409});
  await repository.write(1, {...data,value:'updated'});
  assert.equal(records.size, 2);
  await repository.remove(2);
  assert.equal(await repository.read(), null);
  assert.equal(records.size, 0);
});
