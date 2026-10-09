import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
test('server reports unconfigured services without faking routes or exposing keys', async () => {
  const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { env: { ...process.env, PORT: '18787', PUBLIC_PROVIDERS: 'false', GRAPHHOPPER_API_KEY: '', TOMTOM_API_KEY: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await Promise.race([once(child.stdout, 'data'), new Promise((_, reject) => setTimeout(() => reject(new Error('Server did not start')), 5000))]);
    const health = await (await fetch('http://127.0.0.1:18787/health')).json(); assert.equal(health.routingConfigured, false); assert.equal(health.trafficConfigured, false);
    const route = await fetch('http://127.0.0.1:18787/route', { method: 'POST', body: '{}' }); assert.equal(route.status, 503); assert.ok((await route.json()).error.includes('GRAPHHOPPER_API_KEY'));
    const geocode = await fetch('http://127.0.0.1:18787/geocode?q=Duomo%2C%20Milano'); assert.equal(geocode.status, 503); assert.ok((await geocode.json()).error.includes('GRAPHHOPPER_API_KEY'));
    const traffic = await fetch('http://127.0.0.1:18787/traffic/0/0/0.png'); assert.equal(traffic.status, 503);
  } finally { child.kill(); await once(child, 'exit'); }
});
