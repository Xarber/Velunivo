import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, get } from 'node:http';
import { once } from 'node:events';
import NativeAbortController, { AbortSignal as NativeAbortSignal } from 'abort-controller';
import { requestJson } from '../src/services/request';
test('requests work and cancel real HTTP with React Native’s controller', async () => {
  const original = globalThis.AbortController, originalFetch = globalThis.fetch;
  globalThis.AbortController = NativeAbortController as unknown as typeof AbortController;
  // Node fetch requires its own signal brand. This HTTP adapter accepts the same
  // event-based signal contract as RN fetch, exercising the actual RN controller.
  globalThis.fetch = ((url: string, options: RequestInit) => new Promise((resolve, reject) => {
    const request = get(url, response => {
      let text = ''; response.on('data', chunk => { text += chunk; });
      response.on('end', () => resolve(new Response(text, { status: response.statusCode || 200 })));
    });
    const abort = () => request.destroy(new Error('Aborted'));
    options.signal?.addEventListener('abort', abort);
    request.on('error', reject); request.on('close', () => options.signal?.removeEventListener('abort', abort));
  })) as typeof fetch;
  const server = createServer((req, res) => {
    if (req.url === '/slow') { const timer = setTimeout(() => res.end('{}'), 250); res.on('close', () => clearTimeout(timer)); }
    else res.end(JSON.stringify({ results: [{ label: 'Public test place' }] }));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try {
    assert.equal('timeout' in NativeAbortSignal, false);
    const { body, response } = await requestJson(`http://127.0.0.1:${address.port}/search`, {}, 1000);
    assert.equal(response.status, 200); assert.equal(body.results[0].label, 'Public test place');
    await assert.rejects(requestJson(`http://127.0.0.1:${address.port}/slow`, {}, 25), /Aborted/);
  } finally { globalThis.AbortController = original; globalThis.fetch = originalFetch; server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
