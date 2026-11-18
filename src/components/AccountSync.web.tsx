import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Text from './LocalizedText';
import { Button, usePalette } from './ui';
import { categories, consentKey, readSummary, request, type AccountStatus, type Category, type SummaryRecord } from '../services/accountSync.web';

export default function AccountSync() {
  const palette = usePalette();
  const [status, setStatus] = useState<AccountStatus>();
  const [records, setRecords] = useState<Partial<{ [K in Category]: SummaryRecord | null }>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('account') === 'failed'
    ? 'Sign-in did not complete. Please try again.' : '');
  useEffect(() => {
    void request('status').then(response => response.json()).then(setStatus).catch(() => {});
  }, []);
  useEffect(() => {
    if (!status?.signedIn) return;
    const load = () => Promise.all(categories.map(async category => [category, await readSummary(category)] as const))
      .then(items => setRecords(Object.fromEntries(items)))
      .catch(() => {});
    void load();
    window.addEventListener('velunivo-account-updated', load);
    return () => window.removeEventListener('velunivo-account-updated', load);
  }, [status?.signedIn]);
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
      setMessage(status === '409' ? 'This summary changed on another device. Its account copy was preserved.' : 'Account sync could not finish. Please try again.');
    } finally { setBusy(false); }
  }

  return <View style={{ gap: 10, padding: 16, borderWidth: 1, borderColor: palette.muted, borderRadius: 14 }}>
    <Text style={{ color: palette.text, fontWeight: '700' }}>X-Center ID sync</Text>
    <Text style={{ color: palette.muted }}>Choose which summaries sync automatically on this browser. Rides and GPS tracks stay on this device.</Text>
    {!status.signedIn ? <Button title="Sign in with X-Center ID" icon="person-circle-outline" disabled={busy}
      onPress={() => void run(async () => {
        const result = await (await request('start', { method: 'POST' })).json();
        const url = new URL(result.url);
        if (url.origin !== 'https://id.xcenter.it') throw new Error('Invalid authorization URL');
        window.location.assign(url.href);
      })}/> : <>
      {[status.profile?.name || status.profile?.preferred_username, status.profile?.email,
        status.profile?.age_range].filter(Boolean).map((value, index) =>
        <Text key={index} style={{ color: palette.text }}>{value}</Text>)}
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
          {record !== undefined && status.account && (() => {
            const key = consentKey(status.account, category);
            const approved = window.localStorage.getItem(key);
            const readOnly = approved !== null && approved !== String(record?.revision ?? 0);
            return <>
              {readOnly && <Text style={{ color: palette.muted }}>This browser reads the account copy. It will leave summaries saved by another device intact.</Text>}
              <Button title={approved === null ? 'Enable automatic sync' : 'Pause automatic sync'}
              icon="sync-outline" disabled={busy} onPress={() => void run(async () => {
                if (approved === null) {
                  window.localStorage.setItem(key, record ? 'read-only' : '0');
                  window.dispatchEvent(new Event('velunivo-account-sync'));
                } else {
                  window.localStorage.removeItem(key);
                }
              })}/>
            </>;
          })()}
          {record && <Button title="Delete account summary" icon="trash-outline" secondary disabled={busy}
            onPress={() => {
              if (!window.confirm('Delete this summary from your X-Center ID account?')) return;
              void run(async () => {
                if (status.account) window.localStorage.removeItem(consentKey(status.account, category));
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
