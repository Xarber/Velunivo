import AsyncStorage from '@react-native-async-storage/async-storage';
import {accountRequest as request} from './accountSession';
import { reverseAreaName } from './api';
import { recordedRides } from './rideHistory';

export const categories = ['recent-neighborhoods', 'ride-insights'] as const;
export type Category = typeof categories[number];
type Summary = string[] | { rides: number; kilometers: number; minutes: number };
export type SummaryRecord = { revision: number; data: Summary };

export {accountRequest as request} from './accountSession';

async function makeSummary(category: Category): Promise<Summary> {
  const now = Date.now();
  const rides = (await recordedRides()).filter(ride =>
    (ride.status === 'finished' || ride.status === 'arrived') &&
    ride.endedAt && ride.endedAt <= now && now - ride.endedAt <= 30 * 86_400_000);
  if (category === 'ride-insights') {
    return {
      rides: rides.length,
      kilometers: Math.round(rides.reduce((total, ride) => total + ride.meters, 0) / 1000),
      minutes: Math.round(rides.reduce((total, ride) => total + Math.max(0, ride.endedAt! - ride.startedAt), 0) / 60_000),
    };
  }
  const names = new Set<string>();
  const endpoints = rides.sort((a, b) => b.endedAt! - a.endedAt!).flatMap(ride => ride.end ? [ride.end] : []);
  // Send only coarse endpoints after the user explicitly chooses neighborhood sync.
  for (const endpoint of endpoints.slice(0, 8)) {
    const [lon, lat] = endpoint.map(value => Number(value.toFixed(2)));
    const name = await reverseAreaName([lon, lat, lon, lat]);
    if (name && name.length <= 80) names.add(name);
  }
  return [...names];
}

export type AccountStatus = {
  enabled: boolean;
  portableSync?: boolean;
  signedIn: boolean;
  binding?: string;
  account?: string;
  profile?: { name?: string; preferred_username?: string; email?: string; age_range?: string };
};

export function consentKey(account: string, category: Category) {
  return `velunivo:account-sync:${account}:${category}`;
}

export async function readSummary(category: Category): Promise<SummaryRecord | null> {
  try { return await (await request('summary/' + category)).json(); }
  catch (error) {
    if ((error as Error).message === '404') return null;
    throw error;
  }
}

export async function syncSummaries(status: AccountStatus) {
  if (!status.signedIn || !status.account || !status.binding) return;
  for (const category of categories) {
    const key = consentKey(status.account, category);
    const saved = await AsyncStorage.getItem(key);
    if (saved?.startsWith('paused:')) continue;
    const approved = saved ?? '0';
    const remote = await readSummary(category);
    const revision = remote?.revision ?? 0;
    // This browser may update its own last revision. A newer remote copy is read-only.
    if (String(revision) !== approved) continue;
    const data = await makeSummary(category);
    if (await AsyncStorage.getItem(key) !== saved ||
        JSON.stringify(data) === JSON.stringify(remote?.data)) continue;
    const empty = Array.isArray(data) ? data.length === 0 : data.rides === 0;
    if (!remote && empty) continue;
    const result = await (await request('summary/' + category, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json', 'X-Sync-Binding': status.binding,
        'If-Match': `"${revision}"`,
      },
      body: JSON.stringify(data),
    })).json();
    if (await AsyncStorage.getItem(key) === saved) {
      await AsyncStorage.setItem(key, String(result.revision));
    }
  }
}
