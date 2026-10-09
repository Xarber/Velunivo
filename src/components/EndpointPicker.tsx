import React, { useRef, useState } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Button, Field, usePalette } from './ui';
import { Coord } from '../core/types';
import { searchAddresses, AddressResult } from '../services/api';
export default function EndpointPicker({ label, value, onChange, onSelect, onMap, onLocation, disabled = false }: { label: string; value: string; onChange(v: string): void; onSelect(label: string, coordinate: Coord): void; onMap(): void; onLocation?(): void; disabled?: boolean }) {
  const { width } = useWindowDimensions();
  const p = usePalette(), [results, setResults] = useState<AddressResult[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const searchId = useRef(0);
  function invalidate() { searchId.current++; setResults([]); setBusy(false); setError(''); }
  async function search() { const id = ++searchId.current; setBusy(true); setError(''); setResults([]); try { const found = await searchAddresses(value); if (id !== searchId.current) return; setResults(found); if (!found.length) setError('No matching address. Add a city or choose on the map.'); } catch (e) { if (id === searchId.current) setError(e instanceof Error ? e.message : String(e)); } finally { if (id === searchId.current) setBusy(false); } }
  return <View style={{ gap: 10 }}><Field label={label} placeholder="Street, place and city, or latitude, longitude" value={value} editable={!disabled} onChangeText={v => { invalidate(); onChange(v); }} onSubmitEditing={() => void search()} />
    <View style={{ flexDirection: width < 500 ? 'column' : 'row', gap: 8 }}><View style={{ flex: 1 }}><Button title={busy ? 'Searching…' : `Search ${label.toLowerCase()}`} secondary disabled={disabled || busy || value.trim().length < 3} icon="search" onPress={() => void search()} /></View><Button title={`Pick ${label.toLowerCase()} on map`} secondary disabled={disabled} icon="map-outline" onPress={() => { invalidate(); onMap(); }} /></View>
    {onLocation && <Button title="Use my location" secondary disabled={disabled} icon="locate" onPress={() => { invalidate(); onLocation(); }} />}
    {results.map(r => <Button key={`${r.label}-${r.coordinate}`} title={r.label} secondary disabled={disabled} onPress={() => { invalidate(); onSelect(r.label, r.coordinate); }} />)}
    {!!results.length && <Text style={{ color: p.muted, fontSize: 12 }}>Choose a result to confirm the exact location. Address data © OpenStreetMap contributors.</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#C75A36' }}>{error}</Text>}
  </View>;
}
