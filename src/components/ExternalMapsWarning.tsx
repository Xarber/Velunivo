import React, { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { ExternalNavigation, MapsMode, MapsProvider, mapsDirectionsUrl } from '../core/externalMaps';
import { NavigationWarning } from './RouteWarning';
import { Button, usePalette } from './ui';
export default function ExternalMapsWarning({ journey, onCancel }: { journey: ExternalNavigation; onCancel(): void }) {
  const p = usePalette();
  const [provider, setProvider] = useState<MapsProvider>(Platform.OS === 'ios' ? 'apple' : 'google');
  const [mode, setMode] = useState<MapsMode>('bike');
  const [opening, setOpening] = useState(false), [error, setError] = useState('');
  async function open() {
    if (opening) return;
    setOpening(true); setError('');
    try { await Linking.openURL(mapsDirectionsUrl(provider, journey.start, journey.end, mode)); }
    catch { setError('Could not open that map app. Try the other app or return to the planner.'); }
    finally { setOpening(false); }
  }
  return <NavigationWarning visible cancelLabel="Back to route planner" title="Continue in another map app" messages={['Neither bicycle nor car-road planning returned a usable route.', ...journey.errors]} description="Both selected endpoints will be shared with the map app you choose. It calculates its own route and ETA, without your Velunivo vehicle speed or range settings, and may use traffic. Check vehicle access and local signs before riding." confirmLabel={opening ? 'Opening…' : `Open ${provider === 'apple' ? 'Apple Maps' : 'Google Maps'}`} disabled={opening} onCancel={onCancel} onConfirm={() => void open()}>
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>{(['apple', 'google'] as const).map(value => <View key={value} style={{ flex: 1 }}><Button title={value === 'apple' ? 'Apple Maps' : 'Google Maps'} secondary={provider !== value} onPress={() => { setProvider(value); setError(''); }} disabled={opening} /></View>)}</View>
      <View style={{ flexDirection: 'row', gap: 8 }}>{(['bike', 'car'] as const).map(value => <View key={value} style={{ flex: 1 }}><Button title={value === 'bike' ? 'Cycling' : 'Driving'} secondary={mode !== value} onPress={() => setMode(value)} disabled={opening} /></View>)}</View>
      <Text style={{ color: p.muted, fontSize: 12 }}>Maps may open directions first; start navigation there. Cycling availability depends on the region.</Text>
      {!!error && <Text accessibilityRole="alert" style={{ color: '#C82D3F' }}>{error}</Text>}
    </View>
  </NavigationWarning>;
}
