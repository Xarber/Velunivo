import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { t } from '../i18n/core';
import type { ArchiveKind } from '../core/accountArchive';
import { accountArchiveSizes, setArchiveEnabled, type ArchiveSize } from '../services/accountArchive';
import type { AccountStatus } from '../services/accountSync';
import { observeAccountSync, refreshAccountSync } from './AccountSyncWorker';
import Text from './LocalizedText';
import { usePalette } from './ui';

function categoryLabel(category: ArchiveKind) {
  switch (category) {
    case 'settings': return t('Settings');
    case 'vehicles': return t('Vehicles');
    case 'saved-places': return t('Saved places');
    case 'saved-routes': return t('Saved routes');
    case 'recorded-rides': return t('Recorded rides');
    case 'exploration': return t('Exploration history');
  }
}

export default function AccountArchiveSettings({status}: {status: AccountStatus}) {
  const palette = usePalette();
  const [sizes, setSizes] = useState<ArchiveSize[]>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    function load(error?: unknown) {
      void accountArchiveSizes(status).then(value => {
        if (active) {
          setSizes(value);
          setMessage(!error ? '' : (error as Error).message === '413'
            ? 'A category exceeds the account sync size limit.'
            : 'Some account data could not sync. Velunivo will retry.');
        }
      }, () => { if (active) setMessage('Could not calculate account sync sizes.'); });
    }
    load();
    const stop = observeAccountSync(load);
    return () => { active = false; stop(); };
  }, [status]);

  return <View style={{gap: 10}}>
    <Text style={{color: palette.text, fontWeight: '700'}}>App data</Text>
    <Text style={{color: palette.muted}}>Sizes are estimates before compression. Recorded rides and exploration history start off. Categories with 256 KiB or more also start off.</Text>
    {!sizes && !message && <Text style={{color: palette.muted}}>Calculating local sizes…</Text>}
    {sizes?.map(({category, enabled, bytes}) => {
      const label = categoryLabel(category);
      const size = bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MiB` : `${(bytes / 1024).toFixed(1)} KiB`;
      return <View key={category} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
        <View style={{flex: 1}}>
          <Text translate={false} style={{color: palette.text}}>{label}</Text>
          <Text translate={false} style={{color: palette.muted}}>{size}</Text>
        </View>
        <Switch accessibilityLabel={label} value={enabled} disabled={busy} onValueChange={on => {
          setBusy(true);
          void setArchiveEnabled(status, category, on).then(() => {
            setSizes(old => old?.map(item => item.category === category ? {...item, enabled: on} : item));
            refreshAccountSync();
          }, () => setMessage('Could not save this sync preference.')).finally(() => setBusy(false));
        }}/>
      </View>;
    })}
    {!!message && <Text style={{color: palette.muted}} accessibilityLiveRegion="polite">{message}</Text>}
  </View>;
}
