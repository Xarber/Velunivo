import { Linking, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const server = 'https://velunivo.xcenter.it';
const sessionKey = 'xcenter-id-session-v1';
const verifierKey = 'xcenter-id-verifier-v1';

export async function accountRequest(path: string, init?: RequestInit) {
  const web = Platform.OS === 'web';
  const session = web ? null : await SecureStore.getItemAsync(sessionKey);
  const headers = new Headers(init?.headers);
  if (session) headers.set('Authorization', 'Bearer ' + session);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch((web ? '' : server) + '/api/account/' + path, {
      cache: 'no-store', ...init, headers, signal: controller.signal,
    });
    if (!response.ok) throw new Error(String(response.status));
    return response;
  } finally { clearTimeout(timeout); }
}

export async function startAccountSignIn() {
  const web = Platform.OS === 'web';
  const verifier = web ? '' : Array.from(await Crypto.getRandomBytesAsync(32), value => value.toString(16).padStart(2, '0')).join('');
  const challenge = web ? '' : await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier);
  const response = await accountRequest(web ? 'start' : 'native/start', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challenge }),
  });
  const { url, transaction } = await response.json();
  const destination = new URL(url);
  if (web ? destination.origin !== 'https://id.xcenter.it' :
      destination.origin !== server || destination.pathname !== '/api/account/native/browser' ||
      typeof transaction !== 'string' || !/^[a-f0-9]{64}$/.test(transaction)) throw new Error('Invalid authorization URL');
  if (web) window.location.assign(url);
  else {
    await SecureStore.setItemAsync(verifierKey, JSON.stringify({ verifier, code: transaction, expires: Date.now() + 480_000 }));
    await Linking.openURL(url);
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
    await SecureStore.setItemAsync(sessionKey, session);
    await SecureStore.deleteItemAsync(verifierKey);
    return 'connected';
  } catch (error) {
    if (!['401', '410'].includes((error as Error).message)) throw error;
    await SecureStore.deleteItemAsync(verifierKey);
    return 'expired';
  }
}

export async function signOutAccount() {
  try { await accountRequest('logout', { method: 'POST' }); }
  finally { if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(sessionKey); }
}
