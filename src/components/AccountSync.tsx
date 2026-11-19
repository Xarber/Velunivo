import { Ionicons } from '@expo/vector-icons';
import { AccountOverview } from '../vendor/xcenter-id/AccountOverview';
import { router, useFocusEffect } from 'expo-router';
import { accountReturnFailed, defaultAccountProfile } from '../core/accountProfile';
import { loadAccountProfilePhoto } from '../services/accountProfilePhoto';
import { readSettingEdits } from '../services/syncSettings';
import { useStore } from '../services/store';
import AccountArchiveSettings from './AccountArchiveSettings';
import { accountArchiveBytes } from '../core/accountArchive';
import { t } from '../i18n/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startAccountSignIn, signOutAccount, finishAccountSignIn, cancelAccountSignIn } from '../services/accountSession';
import { observeAccountSync, refreshAccountSync } from './AccountSyncWorker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Switch, View } from 'react-native';
import Text from './LocalizedText';
import { styles, usePalette } from './ui';
import { categories, consentKey, readSummary, request, type AccountStatus, type Category, type SummaryRecord } from '../services/accountSync';

// This ID is public. The confidential client credential stays on the server.
const clientId = 'xid-df7b04a2-7b74-4d2c-81ba-1cdaed9bc495';

export default function AccountSync({ mode = 'details' }: { mode?: 'entry' | 'details' }) {
  const palette = usePalette();
  const store = useStore();
  const latestStore = useRef(store);
  useEffect(() => { latestStore.current = store; }, [store]);
  const [status, setStatus] = useState<AccountStatus>();
  const [summaryBinding, setSummaryBinding] = useState<string>();
  const [preferenceAccount, setPreferenceAccount] = useState<string>();
  const [records, setRecords] = useState<Partial<{ [K in Category]: SummaryRecord | null }>>({});
  const [preferences, setPreferences] = useState<Partial<{ [K in Category]: string | null }>>({});
  const [pendingSignIn, setPendingSignIn] = useState(false);
  const checkSignIn = useRef<() => Promise<void>>(undefined);
  const [accountPhoto, setAccountPhoto] = useState<{ binding: string; uri: string }>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => accountReturnFailed(Platform.OS, Platform.OS === 'web' && typeof window !== 'undefined' ? window : undefined)
    ? 'Sign-in did not complete. Please try again.' : '');
  useFocusEffect(useCallback(() => {
    let active = true;
    let checking = false;
    const check = async (pollOnly = false) => {
      if (checking || !active || (Platform.OS !== 'web' && AppState.currentState === 'background')) return;
      checking = true;
      try {
        const result = await finishAccountSignIn();
        if (!active) return;
        setPendingSignIn(result === 'pending');
        if (pollOnly && (result === 'idle' || result === 'pending')) return;
        if (result === 'connected' || result === 'expired') {
          setMessage(result === 'connected' ? 'Connected to X-Center ID.' : 'Sign-in expired or was declined. Try again.');
        }
        const response = await request('status?renew=1');
        const next: AccountStatus = await response.json();
        if (active) setStatus(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
        if (result === 'connected') refreshAccountSync();
      } catch {
        // Keep an interrupted browser handoff so the next foreground check can retry.
      } finally { checking = false; }
    };
    checkSignIn.current = check;
    void check();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void check(); });
    const timer = Platform.OS === 'web' ? undefined : setInterval(() => void check(true), 5000);
    return () => { active = false; checkSignIn.current = undefined; subscription.remove(); clearInterval(timer); };
  }, []));
  useEffect(() => {
    const account = status?.account;
    if (mode !== 'details' || !status?.signedIn || !status.canSync || !account) return;
    let active = true;
    const load = () => {
      void Promise.all(categories.map(async category =>
        [category, await AsyncStorage.getItem(consentKey(account, category))] as const))
        .then(items => {
          if (!active) return;
          setPreferences(Object.fromEntries(items));
          setPreferenceAccount(account);
        }).catch(() => {});
      void Promise.all(categories.map(async category => [category, await readSummary(category, status.binding)] as const))
        .then(items => {
          if (!active) return;
          setRecords(Object.fromEntries(items));
          setSummaryBinding(status.binding);
        }).catch(() => {});
    };
    load();
    const stop = observeAccountSync(load);
    return () => { active = false; stop(); };
  }, [mode, status?.signedIn, status?.canSync, status?.account, status?.binding]);
  useEffect(() => {
    const profile = status?.profile;
    const binding = status?.binding;
    if (!store.ready || !status?.signedIn || !binding || !profile) return;
    const controller = new AbortController();
    void (async () => {
      const edits = await readSettingEdits();
      const current = latestStore.current.navigationOptions;
      // A missing name alone does not rule out an avatar-only account profile.
      const candidate = profile.hasPicture ? 'pending' : undefined;
      const shouldImport = !!defaultAccountProfile(current, edits, profile, candidate);
      const photo = profile.hasPicture ? await loadAccountProfilePhoto(binding, controller.signal).catch(() => undefined) : undefined;
      if (controller.signal.aborted) return;
      const active: AccountStatus = await (await request('status')).json();
      if (!controller.signal.aborted && active.binding === binding) {
        if (photo) setAccountPhoto({ binding, uri: photo });
        if (shouldImport) await latestStore.current.importDefaultAccountProfile(profile, photo);
      }
    })().catch(() => {});
    return () => controller.abort();
  }, [status, store.ready]);
  if (!status?.enabled) return <Text style={{ color: palette.muted }}>{status ? 'X-Center ID is unavailable on this server.' : 'Checking X-Center ID availability…'}</Text>;

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
      setMessage('Account sync could not finish. Please try again.');
    } finally { setBusy(false); }
  }

  const photo = accountPhoto?.binding === status.binding ? accountPhoto?.uri : undefined;
  const profile = status.profile;

  return <View style={{ gap: 14 }}>
    <AccountOverview mode={mode} clientId={clientId} translate={t} disabled={busy} pendingSignIn={pendingSignIn}
      profile={status.signedIn ? {
        name: profile?.name || profile?.preferred_username || 'X-Center ID',
        username: profile?.preferred_username || '',
        email: profile?.email,
        ageRange: profile?.age_range,
        photo: photo ? { uri: photo } : undefined,
        verified: profile?.verified,
        administrator: profile?.administrator,
      } : null}
      signInDescription={t('Signing in syncs settings, vehicles, saved places and routes, and ride summaries by default. You can change each category. Ride recordings include GPS tracks and stay off until you enable them.')}
      onManageAccount={() => router.push('/settings/xcenter-id')}
      onSignIn={() => run(async () => {
        try {
          await startAccountSignIn(() => {
            setPendingSignIn(true);
            setMessage('Finish signing in in your browser, then return here.');
          }, mode === 'entry');
        } catch (error) {
          setPendingSignIn(false);
          throw error;
        }
        if (Platform.OS === 'ios') await checkSignIn.current?.();
      })}
      onCancelSignIn={() => run(async () => {
        await cancelAccountSignIn();
        setPendingSignIn(false);
      })}
      onSignOut={() => run(async () => {
        await signOutAccount();
        setRecords({});
        setStatus({ enabled: true, signedIn: false });
      })}/>
    {mode === 'details' && status.signedIn && (!status.canSync
      ? <Text style={{ color: palette.muted }}>Account storage permission is off. Sign in again to enable sync.</Text>
      :
      <AccountArchiveSettings key={status.account} status={status}>
      {categories.map(category => {
        const neighborhoods = category === 'recent-neighborhoods';
        const record = summaryBinding === status.binding ? records[category] : undefined;
        const label = neighborhoods ? t('Recently visited neighborhoods') : t('Ride insights');
        const saved = preferenceAccount === status.account ? preferences[category] : undefined;
        const paused = saved?.startsWith('paused:') ?? false;
        const readOnly = !!record && saved !== undefined && !paused && (saved ?? '0') !== String(record.revision);
        const account = status.account;
        return <View key={category} style={[styles.card, { backgroundColor: palette.card, gap: 6 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
            <Ionicons name={neighborhoods ? 'map-outline' : 'stats-chart-outline'} size={20} color={palette.accent}/>
            <View style={{ flex: 1 }}>
              <Text translate={false} style={{ color: palette.text }}>{label}</Text>
              {record && <Text translate={false} style={{ color: palette.muted }}>{accountArchiveBytes(record.data)} B</Text>}
            </View>
            <Switch accessibilityLabel={label} disabled={busy || !account || saved === undefined} value={!paused}
              onValueChange={enabled => void run(async () => {
                if (!account) return;
                const key = consentKey(account, category);
                const current = await AsyncStorage.getItem(key) ?? '0';
                const next = (enabled ? '' : 'paused:') + current.replace(/^paused:/, '');
                await AsyncStorage.setItem(key, next);
                setPreferences(old => ({ ...old, [category]: next }));
                refreshAccountSync();
              })}/>
          </View>
          <Text style={{ color: palette.muted }}>{neighborhoods
            ? 'Approximate destinations from recent rides are sent to Photon to find area names. Only the names are saved to your account.'
            : 'Save the number of rides, total distance and riding time from the last 30 days.'}</Text>
          {record && <Text style={{ color: palette.text }}>{Array.isArray(record.data)
            ? record.data.join(' · ') || 'No neighborhood names'
            : `${record.data.rides} rides · ${record.data.kilometers} km · ${record.data.minutes} min`}</Text>}
          {readOnly && <Text style={{ color: palette.muted }}>This device reads the account copy. It preserves summaries saved by another device.</Text>}
        </View>;
      })}
      </AccountArchiveSettings>)}
    {!!message && <Text accessibilityLiveRegion="polite" style={{ color: palette.text }}>{message}</Text>}
  </View>;
}
