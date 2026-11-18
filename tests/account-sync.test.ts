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
    assert.equal((await fetch(base + '/summary/recent-neighborhoods')).status, 401);
    const callback = await fetch(base + '/callback?code=unbound', { redirect: 'manual' });
    assert.equal(callback.status, 303);
    assert.equal(callback.headers.get('location'), '/settings/data?account=failed');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
