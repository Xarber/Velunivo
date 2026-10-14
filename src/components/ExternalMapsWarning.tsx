import {router} from 'expo-router';
import {requestRecordingStart} from '../services/recordingStartRequest';
import VehicleSelector from './VehicleSelector';
import {t} from '../i18n/core';
import Text from './LocalizedText';
import React, { useState } from 'react';
import {Platform, View} from 'react-native';
import * as Linking from 'expo-linking';
import { ExternalNavigation, MapsMode, MapsProvider, mapsDirectionsUrl } from '../core/externalMaps';
import { NavigationWarning } from './RouteWarning';
import { Button, usePalette } from './ui';
export default function ExternalMapsWarning({ journey, onCancel,beforeRedirect }: { journey: ExternalNavigation; onCancel(): void;beforeRedirect?():Promise<boolean> }) {
  const p = usePalette();
  const [provider, setProvider] = useState<MapsProvider>(Platform.OS === 'ios' ? 'apple' : 'google');
  const [mode, setMode] = useState<MapsMode>('bike');
  const [recordPrompt,setRecordPrompt]=useState(false),[opening, setOpening] = useState(false), [error, setError] = useState('');
  async function open(record:boolean) {
    if (opening) return;
    setOpening(true); setError('');
    try {if(beforeRedirect&& !await beforeRedirect())throw new Error('Could not save the current ride');const url=mapsDirectionsUrl(provider,journey.start,journey.end,mode);if(record){requestRecordingStart(url);onCancel();router.push('/offline/record-trip');}else {await Linking.openURL(url);onCancel();} }
    catch { setError('Could not open that map app. Try the other app or return to the planner.'); }
    finally { setOpening(false); }
  }
  return <NavigationWarning visible hideConfirm={recordPrompt} cancelLabel="Back to route planner" title={t("Continue in another map app")} messages={journey.errors.length?['Neither bicycle nor car-road planning returned a usable route.', ...journey.errors]:[]} description="Both selected endpoints will be shared with the map app you choose. It calculates its own route and ETA, without your Velunivo vehicle speed or range settings, and may use traffic. Check vehicle access and local signs before riding." confirmLabel={opening ? 'Opening…' : `Open ${provider === 'apple' ? 'Apple Maps' : 'Google Maps'}`} disabled={opening||recordPrompt} onCancel={onCancel} onConfirm={()=>setRecordPrompt(true)}>
    <View style={{ gap: 10 }}>
      {recordPrompt&&<><Text style={{color:p.text,fontWeight:'700'}}>Record this trip in Velunivo?</Text><VehicleSelector outlined/><Text style={{color:p.muted,fontSize:12}}>{Platform.OS==='web'?'Web recording needs this page to stay visible. Background recording requires the native app.':'Recording will start before opening maps. Background location permission is required.'}</Text><Button title={t('Record & open maps')} icon="recording-outline" disabled={opening} loading={opening} onPress={()=>void open(true)}/><Button title={t('Open without recording')} icon="open-outline" secondary disabled={opening} onPress={()=>void open(false)}/></>}

      <View style={{ flexDirection: 'row', gap: 8 }}>{(['apple', 'google'] as const).map(value => <View key={value} style={{ flex: 1 }}><Button title={t(value === 'apple' ? 'Apple Maps' : 'Google Maps')} secondary={provider !== value} onPress={() => { setProvider(value); setError(''); }} disabled={opening} /></View>)}</View>
      <View style={{ flexDirection: 'row', gap: 8 }}>{(['bike', 'car'] as const).map(value => <View key={value} style={{ flex: 1 }}><Button title={t(value === 'bike' ? 'Cycling' : 'Driving')} secondary={mode !== value} onPress={() => setMode(value)} disabled={opening} /></View>)}</View>
      <Text style={{ color: p.muted, fontSize: 12 }}>Maps may open directions first; start navigation there. Cycling availability depends on the region.</Text>
      {!!error && <Text accessibilityRole="alert" style={{ color: '#C82D3F' }}>{error}</Text>}
    </View>
  </NavigationWarning>;
}
