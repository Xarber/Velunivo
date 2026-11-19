import { strict as assert } from 'node:assert';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { accountSync, validSummary } from '../server/accountSync';

test('account summaries accept only the declared fields', () => {
  assert(validSummary('ride-insights', { rides: 2, kilometers: 12, minutes: 43 }));
  assert(!validSummary('ride-insights', { rides: 2, kilometers: 12, minutes: 43, track: [[7, 44]] }));
  assert(!validSummary('recent-neighborhoods', [{ name: 'Centro', coordinates: [7, 44] }]));
  assert(!validSummary('other', ['Centro']));
  assert(validSummary('recent-neighborhoods', ['Centro']));
});

test('account sync rejects untrusted origins, unauthenticated access and unbound callbacks', async () => {
  const app = express();
  app.use('/api/account', accountSync('test-client', 'test-secret'));
  const server = createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    assert(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}/api/account`;
    const status = await fetch(base + '/status');
    assert.equal(status.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await status.json(), { enabled: true, signedIn: false });
    assert.equal((await fetch(base + '/start', { method: 'POST', headers: { origin: 'https://other.example' } })).status, 403);
    assert.equal((await fetch(base + '/profile-photo')).status, 401);
    assert.equal((await fetch(base + '/archive/saved-places/sharing', {
      method: 'POST', headers: { Origin: 'https://velunivo.xcenter.it', 'X-Sync-Binding': 'not-a-session' },
    })).status, 401);
    assert.equal((await fetch(base + '/summary/recent-neighborhoods')).status, 401);
    assert.equal((await fetch(base + '/native/exchange', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'a'.repeat(64), verifier: 'b'.repeat(64) }),
    })).status, 401);
    assert.equal((await fetch(base + '/native/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge: 'not-a-sha256' }),
    })).status, 400);
    const callback = await fetch(base + '/callback?code=unbound', { redirect: 'manual' });
    assert.equal(callback.status, 303);
    assert.equal(callback.headers.get('location'), '/settings/xcenter-id?account=failed');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
