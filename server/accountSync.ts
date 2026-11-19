import { sharesArchive, updateSharedArchive } from './accountSharing';
import { createAccountSessions, idleSessionMilliseconds } from './accountSessions';
import { accountArchive, archiveCategories, ArchiveError, ARCHIVE_LIMIT } from './accountArchive';
import { createHash, randomBytes } from 'node:crypto';
import { Router, json, type Request } from 'express';
import * as oidc from 'openid-client';

const issuer = 'https://id.xcenter.it';
const redirect = 'https://velunivo.xcenter.it/api/account/callback';
const origin = new URL(redirect).origin;
const handoffState = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
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

export function accountSync(clientId?: string, secret?: string, sessionDirectory?: string) {
  const router = Router();
  const enabled = !!secret && !!clientId && /^[a-zA-Z0-9_-]{1,100}$/.test(clientId);
  const transactions = new ExpiringStore<{ state: string; nonce: string; verifier: string; nativeChallenge?: string; portableSync: boolean; staySignedIn: boolean; returnToSettings: boolean }>();
  const handoffs = new ExpiringStore<{ session?: string; challenge: string; failed?: boolean }>();
  const browserLaunches = new ExpiringStore<{ authorization: string; key: string }>();
  const sessions = createAccountSessions(clientId ?? '', secret ?? '', enabled ? sessionDirectory : undefined);

  function sessionKey(req: Request) {
    return /^Bearer ([a-f0-9]{64})$/.exec(req.get('authorization') ?? '')?.[1]
      ?? cookie(req, 'velunivo_session');
  }

  async function config() {
    const configuration = await oidc.discovery(new URL(issuer), clientId!, undefined, oidc.ClientSecretBasic(secret!));
    const metadata = configuration.serverMetadata();
    for (const endpoint of [metadata.authorization_endpoint, metadata.token_endpoint, metadata.jwks_uri, metadata.userinfo_endpoint]) {
      if (!endpoint || new URL(endpoint).origin !== issuer) throw new Error('Unexpected identity endpoint');
    }
    oidc.enableNonRepudiationChecks(configuration);
    return configuration;
  }

  async function currentSession(req: Request, res: import('express').Response) {
    const key = sessionKey(req);
    const before = sessions.get(key);
    const session = await sessions.fresh(key, async refresh => {
      const tokens = await oidc.refreshTokenGrant(await config(), refresh);
      return { token: tokens.access_token, refreshToken: tokens.refresh_token, expiresIn: tokens.expires_in ?? 600, canSync: tokens.scope?.split(' ').includes('app_data') };
    });
    if (session && session !== before && !req.get('authorization')) {
      res.cookie('velunivo_session', key, { ...cookieOptions, maxAge: session.expiresAt - Date.now() });
    }
    return session;
  }

  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/status', async (req, res) => {
    const session = req.query.renew === '1' ? await currentSession(req, res) : sessions.get(sessionKey(req));
    res.json({ enabled, ...(sessions.persistent ? { persistentSignIn: true } : {}), signedIn: !!session, binding: session?.binding, profile: session?.profile, canSync: session?.canSync, portableSync: session?.portableSync, account: session && createHash('sha256').update(session.subject).digest('hex') });
  });
  router.use((req, res, next) => {
    if (!enabled) { res.sendStatus(503); return; }
    if (req.method !== 'GET' && req.get('origin') !== origin &&
        (req.get('origin') || !(req.path === '/native/start' || req.path === '/native/exchange' || req.path === '/native/cancel' || /^Bearer [a-f0-9]{64}$/.test(req.get('authorization') ?? '')))) { res.sendStatus(403); return; }
    next();
  });

  router.post(['/start', '/native/start'], json({ limit: '1kb' }), async (req, res) => {
    const native = req.path === '/native/start';
    const nativeChallenge = native ? req.body?.challenge : undefined;
    if (native && (typeof nativeChallenge !== 'string' || !/^[a-f0-9]{64}$/.test(nativeChallenge))) { res.sendStatus(400); return; }
    const configuration = await config();
    const metadata = configuration.serverMetadata();
    const staySignedIn = sessions.persistent &&
      !!metadata.grant_types_supported?.includes('refresh_token') && !!metadata.scopes_supported?.includes('offline_access');
    const transaction = { staySignedIn, state: id(), nonce: id(), verifier: oidc.randomPKCECodeVerifier(), nativeChallenge, portableSync: req.body?.portableSync === true, returnToSettings: !native && req.body?.returnToSettings === true };
    const key = id();
    const url = oidc.buildAuthorizationUrl(configuration, {
      redirect_uri: redirect, response_type: 'code', scope: 'openid profile email age_range app_data' + (staySignedIn ? ' offline_access' : ''),
      prompt: 'consent',
      state: native ? key : transaction.state, nonce: transaction.nonce,
      code_challenge: await oidc.calculatePKCECodeChallenge(transaction.verifier), code_challenge_method: 'S256',
    });
    transactions.set(key, transaction, 300_000);
    if (native) {
      const launch = id();
      handoffs.set(key, { challenge: nativeChallenge }, 300_000);
      browserLaunches.set(launch, { authorization: url.href, key }, 300_000);
      res.json({ url: origin + '/api/account/native/browser?launch=' + launch, transaction: key });
    } else {
      res.cookie('velunivo_login', key, { ...cookieOptions, maxAge: 300_000 });
      res.json({ url: url.href });
    }
  });

  router.get('/native/browser', (req, res) => {
    const launch = req.query.launch;
    const entry = handoffState(launch) ? browserLaunches.get(launch) : undefined;
    if (!entry || !handoffState(launch)) { res.sendStatus(410); return; }
    browserLaunches.delete(launch);
    res.cookie('velunivo_native_login', entry.key, { ...cookieOptions, maxAge: 300_000 });
    res.redirect(303, entry.authorization);
  });

  router.get('/callback', async (req, res) => {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const native = handoffState(state) && !!transactions.get(state)?.nativeChallenge;
    const browserKey = cookie(req, 'velunivo_native_login');
    if (native && browserKey !== state) { res.sendStatus(403); return; }
    const key = native ? state : cookie(req, 'velunivo_login');
    const transaction = transactions.get(key);
    const returnPath = transaction?.returnToSettings ? '/settings' : '/settings/xcenter-id';
    transactions.delete(key);
    res.clearCookie(native ? 'velunivo_native_login' : 'velunivo_login', cookieOptions);
    try {
      if (!transaction || !!transaction.nativeChallenge !== native) throw new Error('Missing login transaction');
      const callback = new URL(redirect);
      callback.search = new URL(req.originalUrl, origin).search;
      const configuration = await config();
      const tokens = await oidc.authorizationCodeGrant(configuration, callback, {
        pkceCodeVerifier: transaction.verifier, expectedState: native ? key : transaction.state,
        expectedNonce: transaction.nonce, idTokenExpected: true,
      });
      const subject = tokens.claims()?.sub;
      if (!subject) throw new Error('Missing account identity');
      const info = await oidc.fetchUserInfo(configuration, tokens.access_token, subject);
      const granted = new Set(tokens.scope?.split(' '));
      const profile: Record<string, string | boolean> = {};
      if ((granted.has('profile') || granted.has('openid')) && info.picture === issuer + '/v1/profile/avatar') {
        profile.hasPicture = true;
      }
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
      if (info.xcenter_verified === true) profile.verified = true;
      if (info.xcenter_admin === true) profile.administrator = true;
      const accessDuration = (tokens.expires_in ?? 300) * 1000;
      const refreshToken = transaction.staySignedIn ? tokens.refresh_token : undefined;
      const duration = refreshToken ? idleSessionMilliseconds : accessDuration;
      const session = id();
      if (transaction.nativeChallenge && !handoffs.get(key)) throw new Error('Canceled native sign-in');
      sessions.save(session, { subject, token: tokens.access_token, refreshToken, binding: id(), profile,
        portableSync: transaction.portableSync, canSync: granted.has('app_data'), accessExpiresAt: Date.now() + accessDuration, expiresAt: Date.now() + duration });
      if (transaction.nativeChallenge) {
        handoffs.delete(key);
        handoffs.set(key, { session, challenge: transaction.nativeChallenge }, 180_000);
        res.type('html').send(browserResult(true));
        return;
      }
      sessions.remove(sessionKey(req));
      res.cookie('velunivo_session', session, { ...cookieOptions, maxAge: duration });
      res.redirect(303, returnPath + '?account=connected');
    } catch {
      if (native && transaction?.nativeChallenge && handoffs.get(key)) {
        handoffs.delete(key);
        handoffs.set(key, { challenge: transaction.nativeChallenge, failed: true }, 180_000);
        res.status(400).type('html').send(browserResult(false));
      } else res.redirect(303, returnPath + '?account=failed');
    }
  });

  router.post('/native/exchange', json({ limit: '1kb' }), (req, res) => {
    const { code, verifier } = req.body ?? {};
    if (!handoffState(code) || !handoffState(verifier)) { res.sendStatus(400); return; }
    const handoff = handoffs.get(code);
    const challenge = createHash('sha256').update(verifier).digest('hex');
    if (!handoff || handoff.challenge !== challenge) {
      res.sendStatus(401); return;
    }
    if (!handoff.session && !handoff.failed) { res.sendStatus(202); return; }
    handoffs.delete(code);
    if (!handoff.session || !sessions.get(handoff.session)) { res.sendStatus(410); return; }
    res.json({ session: handoff.session });
  });

  router.post('/native/cancel', json({ limit: '1kb' }), (req, res) => {
    const { code, verifier } = req.body ?? {};
    if (!handoffState(code) || !handoffState(verifier)) { res.sendStatus(400); return; }
    const handoff = handoffs.get(code);
    if (!handoff || handoff.challenge !== createHash('sha256').update(verifier).digest('hex')) {
      res.sendStatus(401); return;
    }
    if (handoff.session) sessions.remove(handoff.session);
    handoffs.delete(code);
    transactions.delete(code);
    res.sendStatus(204);
  });

  router.post('/logout', (req, res) => {
    sessions.remove(sessionKey(req));
    res.clearCookie('velunivo_session', cookieOptions).sendStatus(204);
  });

  router.get('/profile-photo', async (req, res) => {
    const session = await currentSession(req, res);
    if (!session || req.get('x-sync-binding') !== session.binding) { res.sendStatus(401); return; }
    if (session.profile.hasPicture !== true) { res.sendStatus(404); return; }
    const picture = await fetch(issuer + '/v1/profile/avatar', {
      headers: { Authorization: `Bearer ${session.token}` }, redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!picture.ok || picture.headers.get('content-type')?.split(';')[0] !== 'image/jpeg' || !picture.body) {
      res.sendStatus(404);
      return;
    }
    const reader = picture.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 512 * 1024) { await reader.cancel(); res.sendStatus(413); return; }
      chunks.push(value);
    }
    const image = Buffer.concat(chunks);
    if (image[0] !== 0xff || image[1] !== 0xd8 || image[2] !== 0xff) {
      res.sendStatus(502);
      return;
    }
    res.type('jpeg').send(image);
  });

  router.use('/archive/:category', (req, res, next) => {
    const session = sessions.get(sessionKey(req));
    if (!session || req.get('x-sync-binding') !== session.binding) { res.sendStatus(401); return; }
    next();
  });
  router.post('/archive/:category/sharing', async (req, res) => {
    const session = await currentSession(req, res);
    if (!session || req.get('x-sync-binding') !== session.binding) { res.sendStatus(401); return; }
    if (!session.canSync) { res.sendStatus(403); return; }
    const category = req.params.category;
    if (!sharesArchive(category)) { res.sendStatus(404); return; }
    try {
      await updateSharedArchive(issuer, clientId!, session.token, category);
      res.sendStatus(204);
    } catch (error) {
      res.sendStatus(error instanceof ArchiveError ? error.status : 503);
    }
  });
  router.all('/archive/:category', json({ limit: ARCHIVE_LIMIT }), async (req, res) => {
    const session = await currentSession(req, res);
    if (!session || req.get('x-sync-binding') !== session.binding) { res.sendStatus(401); return; }
    if (!session.canSync) { res.sendStatus(403); return; }
    const category = req.params.category;
    if (!archiveCategories.has(category)) { res.sendStatus(404); return; }
    const archive = accountArchive(issuer, clientId!, session.token, category);
    try {
      if (req.method === 'GET') {
        const record = await archive.read();
        if (!record) { res.sendStatus(404); return; }
        res.json(record);
        return;
      }
      if (req.method !== 'PUT' && req.method !== 'DELETE') { res.sendStatus(405); return; }
      const match = /^"(\d{1,12})"$/.exec(req.get('if-match') ?? '');
      if (!match) { res.sendStatus(428); return; }
      if (req.method === 'DELETE') {
        await archive.remove(Number(match[1]));
        if (sharesArchive(category)) await updateSharedArchive(issuer, clientId!, session.token, category);
        res.sendStatus(204);
        return;
      }
      const data = req.body;
      if (!data || typeof data !== 'object' || Array.isArray(data) ||
        Object.keys(data).some(key => !['schema','category','value','revisions'].includes(key)) ||
        data.schema !== 1 || data.category !== category || !Object.hasOwn(data, 'value')) {
        res.sendStatus(422);
        return;
      }
      res.json(await archive.write(Number(match[1]), data));
    } catch (error) {
      res.sendStatus(error instanceof ArchiveError ? error.status : 503);
    }
  });

  router.all('/summary/:category', json({ limit: '8kb' }), async (req, res) => {
    const method = req.method;
    if (method !== 'GET' && method !== 'PUT') { res.set('Allow', 'GET, PUT').sendStatus(405); return; }
    const session = await currentSession(req, res);
    if (!session || (req.get('x-sync-binding') && req.get('x-sync-binding') !== session.binding)) { res.sendStatus(401); return; }
    if (!session.canSync) { res.sendStatus(403); return; }
    const category = req.params.category;
    if (category !== 'recent-neighborhoods' && category !== 'ride-insights') { res.sendStatus(404); return; }
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

  router.use((error: { status?: number }, _req: Request, res: import('express').Response, _next: import('express').NextFunction) => {
    res.sendStatus(error.status === 413 ? 413 : 503);
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

function browserResult(success: boolean) {
  const heading = success ? 'Signed in to Velunivo' : 'Sign-in did not finish';
  const message = success ? 'Return to the Velunivo app to finish connecting your account.' : 'Return to Velunivo and try signing in again.';
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title><main style="max-width:32rem;margin:15vh auto;padding:1.25rem;font-family:system-ui"><h1>${heading}</h1><p>${message}</p></main></html>`;
}
