import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Text from './LocalizedText';
import { Button, usePalette } from './ui';
import { reverseAreaName } from '../services/api';
import { recordedRides } from '../services/rideHistory';

const categories = ['recent-neighborhoods', 'ride-insights'] as const;
type Category = typeof categories[number];
type Summary = string[] | { rides: number; kilometers: number; minutes: number };
type Record = { revision: number; data: Summary };

async function request(path: string, init?: RequestInit) {
  const result = await fetch('/api/account/' + path, { cache: 'no-store', ...init });
  if (!result.ok) throw new Error(String(result.status));
  return result;
}

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

export default function AccountSync() {
  const palette = usePalette();
  const [status, setStatus] = useState<{ enabled: boolean; signedIn: boolean; binding?: string }>();
  const [records, setRecords] = useState<Partial<{ [K in Category]: Record | null }>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('account') === 'failed'
    ? 'Sign-in did not complete. Please try again.' : '');
  useEffect(() => {
    void request('status').then(response => response.json()).then(setStatus).catch(() => {});
  }, []);
  if (!status?.enabled) return null;

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try { await task(); }
    catch (error) {
      const status = (error as Error).message;
      if (status === '401') {
        setRecords({});
        setStatus({ enabled: true, signedIn: false });
      }
      setMessage(status === '409' ? 'This summary changed on another device. Load it again.' : 'Account sync could not finish. Please try again.');
    } finally { setBusy(false); }
  }

  return <View style={{ gap: 10, padding: 16, borderWidth: 1, borderColor: palette.muted, borderRadius: 14 }}>
    <Text style={{ color: palette.text, fontWeight: '700' }}>X-Center ID sync</Text>
    <Text style={{ color: palette.muted }}>Choose which summaries to save to your account. Rides and GPS tracks stay on this device.</Text>
    {!status.signedIn ? <Button title="Sign in with X-Center ID" icon="person-circle-outline" disabled={busy}
      onPress={() => void run(async () => {
        const result = await (await request('start', { method: 'POST' })).json();
        const url = new URL(result.url);
        if (url.origin !== 'https://id.xcenter.it') throw new Error('Invalid authorization URL');
        window.location.assign(url.href);
      })}/> : <>
      {categories.map(category => {
        const neighborhoods = category === 'recent-neighborhoods';
        const record = records[category];
        return <View key={category} style={{ gap: 8, marginTop: 8 }}>
          <Text style={{ color: palette.text, fontWeight: '600' }}>{neighborhoods ? 'Recently visited neighborhoods' : 'Ride insights'}</Text>
          <Text style={{ color: palette.muted }}>{neighborhoods
            ? 'Approximate destinations from recent rides are sent to Photon to find area names. Only the names are saved to your account.'
            : 'Save the number of rides, total distance and riding time from the last 30 days.'}</Text>
          {record && <Text style={{ color: palette.text }}>{Array.isArray(record.data)
            ? record.data.join(' · ') || 'No neighborhood names'
            : `${record.data.rides} rides · ${record.data.kilometers} km · ${record.data.minutes} min`}</Text>}
          <Button title={record === undefined ? 'Load account summary' : 'Reload account summary'} icon="cloud-download-outline" secondary disabled={busy}
            onPress={() => void run(async () => {
              const response = await fetch('/api/account/summary/' + category, { cache: 'no-store' });
              if (response.status === 404) { setRecords(old => ({ ...old, [category]: null })); return; }
              if (!response.ok) throw new Error(String(response.status));
              const loaded: Record = await response.json();
              setRecords(old => ({ ...old, [category]: loaded }));
            })}/>
          {record !== undefined && <Button title={record ? 'Replace account summary' : 'Save summary to account'} icon="cloud-upload-outline" disabled={busy}
            onPress={() => void run(async () => {
              const data = await makeSummary(category);
              const result = await (await request('summary/' + category, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Sync-Binding': status?.binding ?? '', 'If-Match': `"${record?.revision ?? 0}"` },
                body: JSON.stringify(data),
              })).json();
              setRecords(old => ({ ...old, [category]: { data, revision: result.revision } }));
            })}/>}
          {record && <Button title="Delete account summary" icon="trash-outline" secondary disabled={busy}
            onPress={() => {
              if (!window.confirm('Delete this summary from your X-Center ID account?')) return;
              void run(async () => {
                await request('summary/' + category, { method: 'DELETE', headers: { 'X-Sync-Binding': status?.binding ?? '', 'If-Match': `"${record.revision}"` } });
                setRecords(old => ({ ...old, [category]: null }));
              });
            }}/>}
        </View>;
      })}
      <Button title="Sign out" icon="log-out-outline" secondary disabled={busy} onPress={() => void run(async () => {
        await request('logout', { method: 'POST' });
        setRecords({});
        setStatus({ enabled: true, signedIn: false });
      })}/>
    </>}
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: palette.text }}>{message}</Text>}
  </View>;
}
