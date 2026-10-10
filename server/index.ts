import { createServer } from 'node:http';
import { routeRequest } from '../src/core/routing';
import { addresses, publicRoute } from './providers';
import { defaultProfile } from '../src/core/types';
const key = process.env.GRAPHHOPPER_API_KEY;
const trafficKey = process.env.TOMTOM_API_KEY;
const publicEnabled = process.env.PUBLIC_PROVIDERS !== 'false';
const port = Number(process.env.PORT || 8787);
const budget = new Map<string, { count: number; reset: number }>();
const origins = (process.env.CORS_ORIGIN || 'http://localhost:8081,http://localhost:8082,http://127.0.0.1:8082').split(',');
createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.headers.origin && origins.includes(req.headers.origin)) res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  const send = (code: number, body: unknown) => { res.writeHead(code); res.end(JSON.stringify(body)); };
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.url === '/health') { send(200, { ok: true, routingConfigured: !!key || publicEnabled, geocodingConfigured: !!key || publicEnabled, provider: key ? 'GraphHopper' : publicEnabled ? 'Valhalla + Photon public demo' : 'none', trafficConfigured: !!trafficKey }); return; }
  const url = new URL(req.url || '/', 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/geocode') {
    if (!key && !publicEnabled) { send(503, { error: 'Address search needs GRAPHHOPPER_API_KEY on the server.' }); return; }
    const query = url.searchParams.get('q')?.trim() || '';
    if (query.length < 3 || query.length > 200) { send(400, { error: 'Enter an address or place between 3 and 200 characters.' }); return; }
    const client = req.socket.remoteAddress || 'unknown', now = Date.now();
    for (const [id, v] of budget) if (v.reset < now) budget.delete(id);
    const usage = budget.get(client) ?? { count: 0, reset: now + 60000 }; usage.count++; budget.set(client, usage);
    if (usage.count > 30) { send(429, { error: 'Too many searches. Try again in a minute.' }); return; }
    try {
      if (!key) { send(200, { results: await addresses(query) }); return; }
      const upstream = await fetch(`https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(query)}&limit=5&key=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(10000) });
      const data = await upstream.json();
      if (!upstream.ok) { send(upstream.status === 429 ? 429 : 502, { error: data.message || 'Address provider unavailable.' }); return; }
      const results = (data.hits || []).filter((h: any) => Number.isFinite(h.point?.lng) && Number.isFinite(h.point?.lat)).map((h: any) => ({ name: h.name || h.street || h.city, address: [...new Set([[h.street, h.housenumber].filter(Boolean).join(' '), h.postcode, h.district, h.city, h.county, h.state, h.country].filter(Boolean))].join(', '), label: [...new Set([h.name, [h.street, h.housenumber].filter(Boolean).join(' '), h.postcode, h.district, h.city, h.county, h.state, h.country].filter(Boolean))].join(', '), coordinate: [h.point.lng, h.point.lat] }));
      send(200, { results });
    } catch { send(502, { error: 'Address search unavailable or timed out.' }); }
    return;
  }
  const traffic = /^\/traffic\/(\d+)\/(\d+)\/(\d+)\.png$/.exec(req.url || '');
  if (req.method === 'GET' && traffic) {
    if (!trafficKey) { send(503, { error: 'Live traffic is not configured' }); return; }
    const [, z, x, y] = traffic.map(Number);
    if (z > 22 || x >= 2 ** z || y >= 2 ** z) { send(400, { error: 'Invalid tile' }); return; }
    try {
      const tile = await fetch(`https://api.tomtom.com/traffic/map/4/tile/flow/relative/${z}/${x}/${y}.png?key=${encodeURIComponent(trafficKey)}&tileSize=256`, { signal: AbortSignal.timeout(8000) });
      if (!tile.ok) { send(502, { error: 'Traffic tile unavailable' }); return; }
      res.setHeader('Content-Type', 'image/png'); res.setHeader('Cache-Control', 'public, max-age=60'); res.writeHead(200); res.end(Buffer.from(await tile.arrayBuffer()));
    } catch { send(502, { error: 'Traffic service unavailable' }); }
    return;
  }
  if (req.method !== 'POST' || req.url !== '/route') { send(404, { error: 'Not found' }); return; }
  if (!key && !publicEnabled) { send(503, { error: 'Routing server needs GRAPHHOPPER_API_KEY.' }); return; }
  const client = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  for (const [id, v] of budget) if (v.reset < now) budget.delete(id);
  const usage = budget.get(client) ?? { count: 0, reset: now + 60000 }; usage.count++; budget.set(client, usage);
  if (usage.count > 30) { send(429, { error: 'Too many route requests. Try again in a minute.' }); return; }
  try {
    let raw = '';
    for await (const chunk of req) { raw += chunk; if (raw.length > 8192) { send(413, { error: 'Request too large' }); return; } }
    let body: any; try { body = JSON.parse(raw); } catch { send(400, { error: 'Invalid JSON' }); return; }
    const coord = (p: any) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 85;
    if (!coord(body.start) || !coord(body.end) || !['bike', 'car'].includes(body.kind) || !Number.isFinite(body.maxSpeed) || body.maxSpeed < 1 || body.maxSpeed > 60 || !Number.isFinite(body.ridingLimit) || body.ridingLimit < 1 || body.ridingLimit > 60) { send(400, { error: 'Invalid route parameters' }); return; }
    if (!key) { send(200, { route: await publicRoute(body.start, body.end, body.kind, { ...defaultProfile, maxSpeed: body.maxSpeed, ridingLimit: body.ridingLimit }) }); return; }
    const upstream = await fetch(`https://graphhopper.com/api/1/route?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(routeRequest(body.start, body.end, body.kind, { ...defaultProfile, maxSpeed: body.maxSpeed, ridingLimit: body.ridingLimit })), signal: AbortSignal.timeout(20000),
    });
    const data = await upstream.json();
    if (!upstream.ok) { send(upstream.status === 429 ? 429 : 502, { error: data.message || 'GraphHopper rejected this profile. Check custom-model support for your account.' }); return; }
    send(200, { paths: data.paths });
  } catch (e) { send(502, { error: e instanceof Error ? e.message : 'Routing service unavailable or request timed out.' }); }
}).listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Velunivo routing server on port ${port}; key ${key ? 'configured' : 'missing'}`));
