// SPDX-License-Identifier: AGPL-3.0-only
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const entry = new URL('./m365-inspection/browser.ts', import.meta.url);
const bundle = await build({entryPoints: [entry.pathname], bundle: true, platform: 'browser', format: 'iife', target: 'es2022', write: false});
const html = await readFile(new URL('./m365-inspection/index.html', import.meta.url));
const server = createServer((request, response) => {
  if (request.headers.host !== '127.0.0.1:9347' || request.method !== 'GET') {response.writeHead(403).end(); return;}
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  if (request.url === '/') {response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(html);}
  else if (request.url === '/bundle.js') {response.setHeader('Content-Type', 'text/javascript; charset=utf-8'); response.end(bundle.outputFiles[0].contents);}
  else response.writeHead(404).end();
});
server.listen(9347, '127.0.0.1', () => process.stdout.write('Read-only inspector: http://127.0.0.1:9347/\n'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
