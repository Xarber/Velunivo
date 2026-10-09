import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Button, Field, usePalette } from './ui';
import { Coord } from '../core/types';
import { searchAddresses, AddressResult } from '../services/api';
export default function EndpointPicker({ label, value, onChange, onSelect, onMap, onLocation }: { label: string; value: string; onChange(v: string): void; onSelect(label: string, coordinate: Coord): void; onMap(): void; onLocation?(): void }) {
  const p = usePalette(), [results, setResults] = useState<AddressResult[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function search() { setBusy(true); setError(''); setResults([]); try { const found = await searchAddresses(value); setResults(found); if (!found.length) setError('No matching address. Add a city or choose on the map.'); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } }
  return <View style={{ gap: 10 }}><Field label={label} placeholder="Street, place and city, or latitude, longitude" value={value} onChangeText={v => { onChange(v); setResults([]); setError(''); }} onSubmitEditing={() => void search()} />
    <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button title={busy ? 'Searching…' : `Search ${label.toLowerCase()}`} secondary disabled={busy || value.trim().length < 3} icon="search" onPress={() => void search()} /></View><Button title={`Pick ${label.toLowerCase()} on map`} secondary icon="map-outline" onPress={onMap} /></View>
    {onLocation && <Button title="Use my location" secondary icon="locate" onPress={onLocation} />}
    {results.map(r => <Button key={`${r.label}-${r.coordinate}`} title={r.label} secondary onPress={() => { onSelect(r.label, r.coordinate); setResults([]); }} />)}
    {!!results.length && <Text style={{ color: p.muted, fontSize: 12 }}>Choose a result to confirm the exact location. Address data © OpenStreetMap contributors.</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#C75A36' }}>{error}</Text>}
  </View>;
}
