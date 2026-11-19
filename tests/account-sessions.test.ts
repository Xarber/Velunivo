import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createAccountSessions, idleSessionMilliseconds, type AccountSession } from '../server/accountSessions';

const id = 'a'.repeat(64);
const initial = (now: number): AccountSession => ({
  subject: 'paired-subject', token: 'access-token-secret', refreshToken: 'refresh-token-secret',
  accessExpiresAt: now + 30_000, expiresAt: now + idleSessionMilliseconds,
  binding: 'binding', profile: {}, portableSync: true, canSync: true,
});

test('persistent credentials are encrypted and concurrent renewal rotates only once', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'velunivo-account-test-'));
  try {
    const now = Date.now();
    const stored = createAccountSessions('client', 'test-secret', directory, () => now);
    stored.save(id, initial(now));
    assert(!readFileSync(join(directory, readdirSync(directory)[0])).includes('refresh-token-secret'));
    const restarted = createAccountSessions('client', 'test-secret', directory, () => now);
    assert.equal(restarted.get(id)?.subject, 'paired-subject');
    let exchanges = 0;
    const exchange = async (token: string) => {
      assert.equal(token, 'refresh-token-secret');
      exchanges++;
      assert.equal(readdirSync(directory).length, 0);
      return { token: 'next-access', refreshToken: 'next-refresh', expiresIn: 600, canSync: false };
    };
    const results = await Promise.all([restarted.fresh(id, exchange), restarted.fresh(id, exchange)]);
    assert.equal(exchanges, 1);
    assert(results.every(result => result?.token === 'next-access' && !result.canSync));
    assert.equal(createAccountSessions('client', 'test-secret', directory, () => now).get(id)?.refreshToken, 'next-refresh');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('logout wins over an in-flight refresh and an uncertain response cannot reuse old credentials', async () => {
  const now = Date.now();
  const store = createAccountSessions('client', 'test-secret', undefined, () => now);
  store.save(id, initial(now));
  let finish!: (value: { token: string; refreshToken: string; expiresIn: number }) => void;
  const refreshing = store.fresh(id, () => new Promise(resolve => { finish = resolve; }));
  await Promise.resolve();
  store.remove(id);
  finish({ token: 'new', refreshToken: 'next', expiresIn: 600 });
  assert.equal(await refreshing, undefined);
  assert.equal(store.get(id), undefined);

  store.save(id, initial(now));
  assert.equal(await store.fresh(id, async () => { throw new Error('Network interrupted'); }), undefined);
  let retried = false;
  assert.equal(await store.fresh(id, async () => { retried = true; throw new Error('Unexpected retry'); }), undefined);
  assert(!retried);
});
