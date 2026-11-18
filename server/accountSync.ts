import { createHash, randomBytes } from 'node:crypto';
import { Router, json, type Request } from 'express';
import * as oidc from 'openid-client';

const issuer = 'https://id.xcenter.it';
const redirect = 'https://velunivo.xcenter.it/api/account/callback';
const origin = new URL(redirect).origin;
const id = () => randomBytes(32).toString('hex');
const cookie = (req: Request, name: string) =>
  new RegExp(`(?:^|; )${name}=([a-f0-9]{64})(?:;|$)`).exec(req.headers.cookie ?? '')?.[1] ?? '';
const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/api/account' };

class ExpiringStore<T> {
  private entries = new Map<string, { expires: number; value: T }>();

  get(key: string) {
    const entry = this.entries.get(key);
    return entry && entry.expires > Date.now() ? entry.value : undefined;
  }

  set(key: string, value: T, duration: number) {
    for (const [key, entry] of this.entries) if (entry.expires <= Date.now()) this.entries.delete(key);
    if (this.entries.size >= 1024) throw new Error('Account service busy');
    this.entries.set(key, { value, expires: Date.now() + duration });
  }

  delete(key: string) { this.entries.delete(key); }
}

export function accountSync(clientId?: string, secret?: string) {
  const router = Router();
  const enabled = !!secret && !!clientId && /^[a-zA-Z0-9_-]{1,100}$/.test(clientId);
  const transactions = new ExpiringStore<{ state: string; nonce: string; verifier: string }>();
  const sessions = new ExpiringStore<{ subject: string; token: string; binding: string; profile: Record<string, string> }>();

  async function config() {
    const configuration = await oidc.discovery(new URL(issuer), clientId!, undefined, oidc.ClientSecretBasic(secret!));
    const metadata = configuration.serverMetadata();
    for (const endpoint of [metadata.authorization_endpoint, metadata.token_endpoint, metadata.jwks_uri, metadata.userinfo_endpoint]) {
      if (!endpoint || new URL(endpoint).origin !== issuer) throw new Error('Unexpected identity endpoint');
    }
    oidc.enableNonRepudiationChecks(configuration);
    return configuration;
  }

  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/status', (req, res) => {
    const session = sessions.get(cookie(req, 'velunivo_session'));
    res.json({ enabled, signedIn: !!session, binding: session?.binding, profile: session?.profile, account: session && createHash('sha256').update(session.subject).digest('hex') });
  });
  router.use((req, res, next) => {
    if (!enabled) { res.sendStatus(503); return; }
    if (req.method !== 'GET' && req.get('origin') !== origin) { res.sendStatus(403); return; }
    next();
  });

  router.post('/start', async (_req, res) => {
    const configuration = await config();
    const transaction = { state: id(), nonce: id(), verifier: oidc.randomPKCECodeVerifier() };
    const key = id();
    const url = oidc.buildAuthorizationUrl(configuration, {
      redirect_uri: redirect, response_type: 'code', scope: 'openid profile email age_range app_data',
      state: transaction.state, nonce: transaction.nonce,
      code_challenge: await oidc.calculatePKCECodeChallenge(transaction.verifier), code_challenge_method: 'S256',
    });
    transactions.set(key, transaction, 300_000);
    res.cookie('velunivo_login', key, { ...cookieOptions, maxAge: 300_000 }).json({ url: url.href });
  });

  router.get('/callback', async (req, res) => {
    const key = cookie(req, 'velunivo_login');
    const transaction = transactions.get(key);
    transactions.delete(key);
    res.clearCookie('velunivo_login', cookieOptions);
    try {
      if (!transaction) throw new Error('Missing login transaction');
      const callback = new URL(redirect);
      callback.search = new URL(req.originalUrl, origin).search;
      const configuration = await config();
      const tokens = await oidc.authorizationCodeGrant(configuration, callback, {
        pkceCodeVerifier: transaction.verifier, expectedState: transaction.state,
        expectedNonce: transaction.nonce, idTokenExpected: true,
      });
      const subject = tokens.claims()?.sub;
      if (!subject || !tokens.scope?.split(' ').includes('app_data')) throw new Error('Sync permission declined');
      const info = await oidc.fetchUserInfo(configuration, tokens.access_token, subject);
      const granted = new Set(tokens.scope?.split(' '));
      const profile: Record<string, string> = {};
      for (const [scope, fields] of [
        ['profile', ['name', 'preferred_username']],
        ['email', ['email']],
        ['age_range', ['age_range']],
      ] as const) {
        if (!granted.has(scope)) continue;
        for (const field of fields) {
          const value = info[field];
          if (typeof value === 'string' && value.length <= 254) profile[field] = value;
        }
      }
      const duration = Math.min(3600, tokens.expires_in ?? 300) * 1000;
      const session = id();
      sessions.set(session, { subject, token: tokens.access_token, binding: id(), profile }, duration);
      sessions.delete(cookie(req, 'velunivo_session'));
      res.cookie('velunivo_session', session, { ...cookieOptions, maxAge: duration });
      res.redirect(303, '/settings/data?account=connected');
    } catch {
      res.redirect(303, '/settings/data?account=failed');
    }
  });

  router.post('/logout', (req, res) => {
    sessions.delete(cookie(req, 'velunivo_session'));
    res.clearCookie('velunivo_session', cookieOptions).sendStatus(204);
  });

  router.all('/summary/:category', json({ limit: '8kb' }), async (req, res) => {
    const session = sessions.get(cookie(req, 'velunivo_session'));
    if (!session) { res.sendStatus(401); return; }
    const category = req.params.category;
    if (category !== 'recent-neighborhoods' && category !== 'ride-insights') { res.sendStatus(404); return; }
    const method = req.method;
    if (!['GET', 'PUT', 'DELETE'].includes(method)) { res.sendStatus(405); return; }
    const headers: Record<string, string> = { Authorization: `Bearer ${session.token}` };
    if (method !== 'GET') {
      if (req.get('x-sync-binding') !== session.binding) { res.sendStatus(401); return; }
      const revision = req.get('if-match');
      if (!revision || !/^"\d{1,12}"$/.test(revision)) { res.sendStatus(428); return; }
      headers['If-Match'] = revision;
    }
    let body: string | undefined;
    if (method === 'PUT') {
      const data = req.body;
      if (!validSummary(category, data)) { res.sendStatus(422); return; }
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ data, public: false, readers: [] });
    }
    const upstream = await fetch(`${issuer}/v1/apps/${clientId}/data/${category}/summary`, {
      method, headers, body, redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) {
      res.sendStatus([401, 403, 404, 409, 413, 422].includes(upstream.status) ? upstream.status : 503);
      return;
    }
    const result = await upstream.json();
    if (method === 'GET' && (result.shared !== false || result.public !== false || !validSummary(category, result.data))) {
      res.sendStatus(502); return;
    }
    res.json(method === 'GET' ? { data: result.data, revision: result.revision } : { revision: result.revision });
  });

  router.use((_error: unknown, _req: Request, res: import('express').Response, _next: import('express').NextFunction) => {
    res.sendStatus(503);
  });
  router.use((_req, res) => { res.sendStatus(404); });
  return router;
}

export function validSummary(category: string, data: unknown): boolean {
  if (category === 'recent-neighborhoods') {
    return Array.isArray(data) && data.length <= 12 &&
      data.every(name => typeof name === 'string' && name.trim().length > 0 && name.length <= 80);
  }
  if (category !== 'ride-insights' || !data || typeof data !== 'object' || Array.isArray(data)) return false;
  const values = data as Record<string, unknown>;
  return Object.keys(values).length === 3 && ['rides', 'kilometers', 'minutes'].every(key =>
    typeof values[key] === 'number' && Number.isSafeInteger(values[key]) && values[key] >= 0);
}
