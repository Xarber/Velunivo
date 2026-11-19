import { Linking, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

const server = 'https://velunivo.xcenter.it';
const sessionKey = 'xcenter-id-session-v1';
const verifierKey = 'xcenter-id-verifier-v1';

export async function accountRequest(path: string, init?: RequestInit) {
  const web = Platform.OS === 'web';
  const session = web ? null : await SecureStore.getItemAsync(sessionKey);
  const headers = new Headers(init?.headers);
  if (session) headers.set('Authorization', 'Bearer ' + session);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (init?.signal?.aborted) cancel();
  else init?.signal?.addEventListener('abort', cancel);
  const timeout = setTimeout(() => controller.abort(), path.startsWith('archive/') ? 90_000 : 15_000);
  try {
    const response = await fetch((web ? '' : server) + '/api/account/' + path, {
      cache: 'no-store', ...init, headers, signal: controller.signal,
    });
    if (!response.ok) throw new Error(String(response.status));
    return response;
  } finally {
    clearTimeout(timeout);
    init?.signal?.removeEventListener('abort', cancel);
  }
}

async function openAccountBrowser(url: string) {
  if (Platform.OS === 'ios') {
    await WebBrowser.openBrowserAsync(url, {
      dismissButtonStyle: 'done',
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
    return;
  }
  if (Platform.OS === 'android') {
    const browsers = await WebBrowser.getCustomTabsSupportingBrowsersAsync().catch(() => null);
    const browserPackage = browsers && [
      browsers.defaultBrowserPackage, browsers.preferredBrowserPackage, ...browsers.browserPackages,
    ].find(candidate => candidate && browsers.servicePackages.includes(candidate) && browsers.browserPackages.includes(candidate));
    if (browserPackage) {
      await WebBrowser.openBrowserAsync(url, { browserPackage, createTask: false });
      return;
    }
  }
  await Linking.openURL(url);
}

export async function startAccountSignIn(onBrowserReady: () => void) {
  const web = Platform.OS === 'web';
  const verifier = web ? '' : Array.from(await Crypto.getRandomBytesAsync(32), value => value.toString(16).padStart(2, '0')).join('');
  const challenge = web ? '' : await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier);
  const response = await accountRequest(web ? 'start' : 'native/start', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challenge, portableSync: true }),
  });
  const { url, transaction } = await response.json();
  const destination = new URL(url);
  if (web ? destination.origin !== 'https://id.xcenter.it' :
      destination.origin !== server || destination.pathname !== '/api/account/native/browser' ||
      typeof transaction !== 'string' || !/^[a-f0-9]{64}$/.test(transaction)) throw new Error('Invalid authorization URL');
  if (web) window.location.assign(url);
  else {
    await SecureStore.setItemAsync(verifierKey, JSON.stringify({ verifier, code: transaction, expires: Date.now() + 480_000 }));
    onBrowserReady();
    try {
      await openAccountBrowser(url);
    } catch (error) {
      // Launch URLs are single-use. Discard this attempt so Retry starts with a new one.
      await cancelAccountSignIn().catch(() => {});
      throw error;
    }
  }
}

export async function finishAccountSignIn() {
  if (Platform.OS === 'web') return 'idle';
  const pending = await SecureStore.getItemAsync(verifierKey);
  if (!pending) return 'idle';
  const { verifier, code, expires } = JSON.parse(pending);
  if (Date.now() >= expires) {
    await SecureStore.deleteItemAsync(verifierKey);
    return 'expired';
  }
  try {
    const response = await accountRequest('native/exchange', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, verifier }),
    });
    if (response.status === 202) return 'pending';
    const { session } = await response.json();
    if (typeof session !== 'string' || !/^[a-f0-9]{64}$/.test(session)) throw new Error('Invalid session');
    if (await SecureStore.getItemAsync(verifierKey) !== pending) return 'idle';
    await SecureStore.setItemAsync(sessionKey, session);
    await SecureStore.deleteItemAsync(verifierKey);
    return 'connected';
  } catch (error) {
    if (!['401', '410'].includes((error as Error).message)) throw error;
    if (await SecureStore.getItemAsync(verifierKey) === pending) await SecureStore.deleteItemAsync(verifierKey);
    return 'expired';
  }
}

export async function signOutAccount() {
  try { await accountRequest('logout', { method: 'POST' }); }
  finally { if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(sessionKey); }
}

export async function cancelAccountSignIn() {
  if (Platform.OS === 'web') return;
  const pending = await SecureStore.getItemAsync(verifierKey);
  await SecureStore.deleteItemAsync(verifierKey);
  if (!pending) return;
  const { code, verifier } = JSON.parse(pending);
  await accountRequest('native/cancel', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, verifier }),
  }).catch(() => {});
}
