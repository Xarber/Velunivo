import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {requestRecordingStart} from '../services/recordingStartRequest';
import VehicleSelector from './VehicleSelector';
import {t} from '../i18n/core';
import Text from './LocalizedText';
import React, { useState } from 'react';
import {Platform, View,Pressable} from 'react-native';
import * as Linking from 'expo-linking';
import { ExternalNavigation, MapsMode, MapsProvider, mapsDirectionsUrl } from '../core/externalMaps';
import { NavigationWarning } from './RouteWarning';
import { Button, usePalette } from './ui';
export default function ExternalMapsWarning({ journey, onCancel,beforeRedirect }: { journey: ExternalNavigation; onCancel(): void;beforeRedirect?():Promise<boolean> }) {
  const p = usePalette();
  const [provider, setProvider] = useState<MapsProvider>(Platform.OS === 'ios' ? 'apple' : 'google');
  const [mode, setMode] = useState<MapsMode>('bike');
  const [record,setRecord]=useState(false),[opening, setOpening] = useState(false), [error, setError] = useState('');
  async function open(record:boolean) {
    if (opening) return;
    setOpening(true); setError('');
    try {if(beforeRedirect&& !await beforeRedirect())throw new Error('Could not save the current ride');const url=mapsDirectionsUrl(provider,journey.start,journey.end,mode);if(record){requestRecordingStart(url);onCancel();router.push('/offline/record-trip');}else {await Linking.openURL(url);onCancel();} }
    catch { setError('Could not open that map app. Try the other app or return to the planner.'); }
    finally { setOpening(false); }
  }
  return <NavigationWarning visible cancelLabel="Back to route planner" title={t("Continue in another map app")} messages={journey.errors.length?['Neither bicycle nor car-road planning returned a usable route.', ...journey.errors]:[]} description="Both selected endpoints will be shared with the map app you choose. It calculates its own route and ETA, without your Velunivo vehicle speed or range settings, and may use traffic. Check vehicle access and local signs before riding." confirmLabel={opening ? 'Opening…' : `Open ${provider === 'apple' ? 'Apple Maps' : 'Google Maps'}`} disabled={opening} onCancel={onCancel} onConfirm={()=>void open(record)}>
    <View style={{ gap: 10 }}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={t('Record this trip in Velunivo')} accessibilityState={{checked:record,disabled:opening}} disabled={opening} onPress={()=>setRecord(v=>!v)} style={{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:8}}><Ionicons name={record?'checkbox':'square-outline'} size={24} color={p.accent}/><Text style={{color:p.text,flex:1}}>Record this trip in Velunivo</Text></Pressable>
      {record&&<View style={{gap:12,padding:12,borderRadius:16,backgroundColor:p.card}}><VehicleSelector outlined/><Text style={{color:p.muted,fontSize:12}}>{Platform.OS==='web'?'Web recording needs this page to stay visible. Background recording requires the native app.':'Recording will start before opening maps. Background location permission is required.'}</Text></View>}

      <View style={{ flexDirection: 'row', gap: 8 }}>{(['apple', 'google'] as const).map(value => <View key={value} style={{ flex: 1 }}><Button title={t(value === 'apple' ? 'Apple Maps' : 'Google Maps')} secondary={provider !== value} onPress={() => { setProvider(value); setError(''); }} disabled={opening} /></View>)}</View>
      <View style={{ flexDirection: 'row', gap: 8 }}>{(['bike', 'car'] as const).map(value => <View key={value} style={{ flex: 1 }}><Button title={t(value === 'bike' ? 'Cycling' : 'Driving')} secondary={mode !== value} onPress={() => setMode(value)} disabled={opening} /></View>)}</View>
      <Text style={{ color: p.muted, fontSize: 12 }}>Maps may open directions first; start navigation there. Cycling availability depends on the region.</Text>
      {!!error && <Text accessibilityRole="alert" style={{ color: '#C82D3F' }}>{error}</Text>}
    </View>
  </NavigationWarning>;
}
