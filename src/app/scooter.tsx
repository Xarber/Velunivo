import React, { useState } from 'react';
import { Text, View, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../services/store';
import { Button, Field, styles, usePalette } from '../components/ui';
import { Profile } from '../core/types';
function NumberField({ label, value, min, max, onSave }: { label: string; value: number; min: number; max: number; onSave(v: number): void }) {
  const [text, setText] = useState(String(value)), [error, setError] = useState(''); const p = usePalette();
  return <View style={{ gap: 4 }}><Field label={label} value={text} onChangeText={setText} keyboardType="decimal-pad" onEndEditing={() => { const v = Number(text.replace(',', '.')); if (!Number.isFinite(v) || v < min || v > max) { setError(`Choose ${min}–${max}.`); setText(String(value)); } else { setError(''); onSave(v); } }} />{!!error && <Text style={{ color: '#C75A36' }}>{error}</Text>}<Text style={{ color: p.muted, fontSize: 11 }}>Range {min}–{max}</Text></View>;
}
export default function Scooter() {
  const p = usePalette(), { profile, updateProfile } = useStore();
  const fields: { key: keyof Profile; label: string; min: number; max: number }[] = [
    { key: 'maxSpeed', label: 'HARDWARE MAX · KM/H', min: 1, max: 60 }, { key: 'ridingLimit', label: 'LOCAL RIDING LIMIT · KM/H', min: 1, max: 60 }, { key: 'cruiseFactor', label: 'CRUISE FRACTION · 0.8 = 80%', min: .2, max: 1 }, { key: 'acceleration', label: 'ACCELERATION · M/S²', min: .1, max: 4 }, { key: 'stopDelay', label: 'DELAY PER MANEUVER · SECONDS', min: 0, max: 120 },
  ];
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: p.bg }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, gap: 18, width: '100%', maxWidth: 780, alignSelf: 'center' }}>
    <Text style={[styles.title, { color: p.text }]}>Made for your ride.</Text><Text style={[styles.subtitle, { color: p.muted }]}>Set your e-scooter or e-bike’s capability. Keep the local riding limit separate: your ETA uses the lower speed.</Text>
    <View style={[styles.card, { backgroundColor: p.card }]}><Field label="VEHICLE NAME" value={profile.name} onChangeText={name => updateProfile({ name })} />{fields.map(f => <NumberField key={`${f.key}-${profile[f.key]}`} label={f.label} value={profile[f.key] as number} min={f.min} max={f.max} onSave={v => updateProfile({ [f.key]: v })} />)}</View>
    <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button title="E-scooter" secondary onPress={() => updateProfile({ name: 'My e-scooter', maxSpeed: 35, ridingLimit: 20 })} /></View><View style={{ flex: 1 }}><Button title="E-bike" secondary onPress={() => updateProfile({ name: 'My e-bike', maxSpeed: 25, ridingLimit: 25 })} /></View></View>
    <View style={[styles.card, { backgroundColor: p.card }]}>{(['voice', 'motion'] as const).map(key => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View style={{ flex: 1 }}><Text style={{ color: p.text, fontWeight: '700' }}>{key === 'voice' ? 'Spoken directions' : 'Motion readings'}</Text><Text style={{ color: p.muted, fontSize: 12 }}>{key === 'voice' ? 'For routes with turn instructions' : 'Accelerometer and gyroscope during GPS rides'}</Text></View><Switch accessibilityLabel={key === 'voice' ? 'Spoken directions' : 'Motion readings'} value={profile[key]} onValueChange={v => updateProfile({ [key]: v })} trackColor={{ true: p.accent }} /></View>)}</View>
    <Text style={{ color: p.muted, lineHeight: 21 }}>The practical ETA models cruise speed, slower segments and maneuver delays. It does not predict traffic, gradients, battery range or weather. Motion readings are diagnostics, not crash detection or dead reckoning.</Text>
    <Text style={{ color: p.muted, lineHeight: 21 }}>Italy’s scooter preset uses a 20 km/h riding limit. A bicycle or car profile does not verify scooter eligibility; check urban-road status and signs. Settings can be changed for the jurisdiction where you ride.</Text>
  </ScrollView></SafeAreaView>;
}
