import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Switch, View } from 'react-native';
import { t } from '../i18n/core';
import { archiveEnabled, archiveKinds, type ArchiveKind } from '../core/accountArchive';
import { archivePreferences, setArchiveEnabled } from '../services/accountArchive';
import { estimateArchiveBytes } from '../services/accountArchiveSizes';
import { subscribeDataChange } from '../services/dataChange';
import { subscribeRides } from '../services/rideHistory';
import type { AccountStatus } from '../services/accountSync';
import { observeAccountSync, refreshAccountSync } from './AccountSyncWorker';
import Text from './LocalizedText';
import { styles, usePalette } from './ui';

type Icon = keyof typeof Ionicons.glyphMap;
function categoryPresentation(category: ArchiveKind): [string, Icon] {
  switch (category) {
    case 'settings': return [t('Settings'), 'settings-outline'];
    case 'vehicles': return [t('Vehicles'), 'bicycle-outline'];
    case 'saved-places': return [t('Saved places'), 'location-outline'];
    case 'saved-routes': return [t('Saved routes'), 'navigate-outline'];
    case 'recorded-rides': return [t('Recorded rides'), 'time-outline'];
    case 'exploration': return [t('Exploration history'), 'compass-outline'];
  }
}

export default function AccountArchiveSettings({status, children}: {status: AccountStatus; children: ReactNode}) {
  const palette = usePalette();
  const [sizes, setSizes] = useState<Partial<Record<ArchiveKind, number>>>({});
  const [preferences, setPreferences] = useState<Awaited<ReturnType<typeof archivePreferences>>>();
  const [message, setMessage] = useState('');
  const [failedSizes, setFailedSizes] = useState(false);
  const [busy, setBusy] = useState(false);
  const account = status.account;

  useEffect(() => {
    if (!account) return;
    let active = true;
    void archivePreferences(account).then(value => { if (active) setPreferences(value); },
      () => { if (active) setMessage('Could not load sync preferences.'); });
    return () => { active = false; };
  }, [account]);
  useEffect(() => {
    let active = true;
    let generation = 0;
    let timer: ReturnType<typeof setTimeout>;
    const load = () => {
      const current = ++generation;
      for (const category of archiveKinds) {
        void estimateArchiveBytes(category).then(bytes => {
          if (active && current === generation) setSizes(old => ({ ...old, [category]: bytes }));
        }, () => { if (active && current === generation) setFailedSizes(true); });
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(load, 500);
    };
    load();
    const stopData = subscribeDataChange(schedule);
    const stopRides = subscribeRides(schedule);
    return () => {
      active = false;
      clearTimeout(timer);
      stopData();
      stopRides();
    };
  }, []);
  useEffect(() => observeAccountSync(error => {
    setMessage(!error ? '' : (error as Error).message === '413'
      ? 'A category exceeds the account sync size limit.'
      : 'Some account data could not sync. Velunivo will retry.');
  }), []);

  return <View style={{ gap: 12 }}>
    <Text style={{ color: palette.text, fontWeight: '700' }}>App data</Text>
    <Text style={{ color: palette.muted }}>Sizes are estimates before compression. Recorded rides and exploration history start off. Categories with 256 KiB or more also start off.</Text>
    {archiveKinds.map(category => {
      const [label, icon] = categoryPresentation(category);
      const bytes = sizes[category];
      const size = bytes === undefined ? undefined : bytes >= 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MiB` : `${(bytes / 1024).toFixed(1)} KiB`;
      const enabled = archiveEnabled(category, bytes ?? 0, preferences?.[category] ?? null, status.portableSync === true);
      return <View key={category} style={[styles.card, { backgroundColor: palette.card, flexDirection: 'row', alignItems: 'center', minHeight: 56 }]}>
        <Ionicons name={icon} size={20} color={palette.accent}/>
        <View style={{ flex: 1 }}>
          <Text translate={false} style={{ color: palette.text }}>{label}</Text>
          {size && <Text translate={false} style={{ color: palette.muted }}>{size}</Text>}
        </View>
        <Switch accessibilityLabel={label} value={enabled} disabled={busy || !preferences} onValueChange={on => {
          setBusy(true);
          void setArchiveEnabled(status, category, on).then(() => {
            setPreferences(old => old && { ...old, [category]: on ? 'on' : 'off' });
            refreshAccountSync();
          }, () => setMessage('Could not save this sync preference.')).finally(() => setBusy(false));
        }}/>
      </View>;
    })}
    {children}
    <Text style={{ color: palette.muted }}>Linked apps can request saved places (including addresses and coordinates), general areas you’ve explored, recent neighborhood names, and ride totals. You choose what each app can read in X-Center ID.</Text>
    {(!!message || failedSizes) && <Text style={{ color: palette.muted }} accessibilityLiveRegion="polite">{message || 'Could not calculate account sync sizes.'}</Text>}
  </View>;
}
