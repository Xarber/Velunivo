import AsyncStorage from '@react-native-async-storage/async-storage';
import { startAccountSignIn, signOutAccount } from '../services/accountSession';
import { observeAccountSync, refreshAccountSync } from './AccountSyncWorker';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Switch, View } from 'react-native';
import Text from './LocalizedText';
import { Button, usePalette } from './ui';
import { categories, consentKey, readSummary, request, type AccountStatus, type Category, type SummaryRecord } from '../services/accountSync';

export default function AccountSync() {
  const palette = usePalette();
  const [status, setStatus] = useState<AccountStatus>();
  const [records, setRecords] = useState<Partial<{ [K in Category]: SummaryRecord | null }>>({});
  const [preferences, setPreferences] = useState<Partial<{ [K in Category]: string | null }>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('account') === 'failed'
    ? 'Sign-in did not complete. Please try again.' : '');
  useEffect(() => {
    void request('status').then(response => response.json()).then(setStatus).catch(() => setStatus({ enabled: false, signedIn: false }));
  }, []);
  useEffect(() => {
    if (!status?.signedIn) return;
    const load = () => Promise.all(categories.map(async category => [category, await readSummary(category)] as const))
      .then(items => setRecords(Object.fromEntries(items)))
      .catch(() => {});
    void load();
        return observeAccountSync(load);
  }, [status?.signedIn]);
  useEffect(() => {
    const account = status?.account;
    if (!account) return;
    const load = () => void Promise.all(categories.map(async category =>
      [category, await AsyncStorage.getItem(consentKey(account, category))] as const))
      .then(items => setPreferences(Object.fromEntries(items))).catch(() => {});
    load();
    return observeAccountSync(load);
  }, [status?.account]);
  if (!status?.enabled) return <Text style={{ color: palette.muted }}>{status ? 'X-Center ID is unavailable on this server.' : 'Checking X-Center ID availability…'}</Text>;

  const nativeLinkReady = Platform.OS === 'web' ||
    (Platform.OS === 'ios' ? status.nativeLinks?.ios : status.nativeLinks?.android);

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
    <Text style={{ color: palette.muted }}>Signing in enables automatic sync for recent neighborhood names and 30-day ride totals. You can pause either category. Photon receives approximate destinations to look up neighborhood names. Full rides and GPS tracks stay on this device.</Text>
    {!status.signedIn ? nativeLinkReady ? <Button title="Sign in with X-Center ID" icon="person-circle-outline" disabled={busy}
      onPress={() => void run(startAccountSignIn)}/> :
      <Text style={{ color: palette.muted }}>Sign-in is unavailable until the server can verify links for this app.</Text> : <>
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
          {status.account && preferences[category] !== undefined && (() => {
            const key = consentKey(status.account, category);
            const saved = preferences[category];
            const paused = saved?.startsWith('paused:') ?? false;
            const readOnly = !!record && !paused && (saved ?? '0') !== String(record.revision);
            return <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: palette.text }}>Automatic sync</Text>
                <Switch accessibilityLabel={neighborhoods ? 'Sync recent neighborhoods' : 'Sync ride insights'}
                  disabled={busy} value={!paused} onValueChange={enabled => void run(async () => {
                    const current = await AsyncStorage.getItem(key) ?? '0';
                    const next = enabled ? current.replace(/^paused:/, '') : 'paused:' + current.replace(/^paused:/, '');
                    await AsyncStorage.setItem(key, next);
                    setPreferences(old => ({ ...old, [category]: next }));
                    refreshAccountSync();
                  })}/>
              </View>
              {readOnly && <Text style={{ color: palette.muted }}>This device reads the account copy. It preserves summaries saved by another device.</Text>}
            </>;
          })()}
          {record && <Button title="Delete account summary" icon="trash-outline" secondary disabled={busy}
            onPress={() => {
              const remove = () => void run(async () => {
                if (status.account) {
                  await AsyncStorage.setItem(consentKey(status.account, category), 'paused:0');
                  setPreferences(old => ({ ...old, [category]: 'paused:0' }));
                }
                await request('summary/' + category, { method: 'DELETE', headers: { 'X-Sync-Binding': status.binding ?? '', 'If-Match': `"${record.revision}"` } });
                setRecords(old => ({ ...old, [category]: null }));
              });
              const prompt = 'Delete this summary from your X-Center ID account?';
              if (Platform.OS === 'web') { if (window.confirm(prompt)) remove(); }
              else Alert.alert(prompt, undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: remove }]);
            }}/>}
        </View>;
      })}
      <Button title="Sign out" icon="log-out-outline" secondary disabled={busy} onPress={() => void run(async () => {
        await signOutAccount();
        setRecords({});
        setStatus({ enabled: true, signedIn: false });
      })}/>
    </>}
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: palette.text }}>{message}</Text>}
  </View>;
}
