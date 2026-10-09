import React, { useRef, useState } from 'react';
import { Keyboard, TextInput, View, Text } from 'react-native';
import { Button, IconButton, usePalette, styles } from './ui';
import { Coord } from '../core/types';
import { searchAddresses, AddressResult } from '../services/api';
export default function EndpointPicker({ label, value, onChange, onSelect, onMap, onLocation, onFocus, showLocation = true, disabled = false }: { label: string; value: string; onChange(v: string): void; onSelect(label: string, coordinate: Coord): void; onMap(): void; onLocation?(): void; disabled?: boolean; onFocus?(): void; showLocation?: boolean }) {
  const p = usePalette(), [results, setResults] = useState<AddressResult[]>([]), [focused, setFocused] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const searchId = useRef(0), input = useRef<TextInput>(null);
  function invalidate() { searchId.current++; setResults([]); setBusy(false); setError(''); }
  function dismiss() { input.current?.blur(); Keyboard.dismiss(); setFocused(false); }
  async function search() { const id = ++searchId.current; setBusy(true); setError(''); setResults([]); try { const found = await searchAddresses(value); if (id !== searchId.current) return; setResults(found); if (!found.length) setError('No matching address. Add a city or choose on the map.'); } catch (e) { if (id === searchId.current) setError(e instanceof Error ? e.message : String(e)); } finally { if (id === searchId.current) setBusy(false); } }
  return <View style={{ gap: 8 }}><Text style={{ color: p.muted, fontSize: 12, fontWeight: '700' }}>{label.toUpperCase()}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 16, paddingRight: 4, backgroundColor: p.card, borderWidth: 1, borderColor: p.line }}><TextInput ref={input} accessibilityLabel={label} placeholder="Address, place or coordinates" placeholderTextColor={p.muted} value={value} editable={!disabled} onFocus={() => { setFocused(true); onFocus?.(); }} onChangeText={v => { invalidate(); onChange(v); }} onSubmitEditing={() => void search()} returnKeyType="search" style={[styles.field, { flex: 1, minWidth: 0, color: p.text, borderWidth: 0 }]} /><IconButton label={busy ? `Searching ${label}` : `Search ${label}`} icon="search" disabled={disabled || busy || value.trim().length < 3} onPress={() => void search()} /><IconButton label={`Pick ${label} on map`} icon="map-outline" disabled={disabled} onPress={() => { invalidate(); dismiss(); onMap(); }} /></View>
    {focused && showLocation && onLocation && <Button title="Use my location" secondary disabled={disabled} icon="locate" onPress={() => { invalidate(); dismiss(); onLocation(); }} />}
    {results.map(r => <Button key={`${r.label}-${r.coordinate}`} title={r.label} secondary icon="location-outline" disabled={disabled} onPress={() => { invalidate(); dismiss(); onSelect(r.label, r.coordinate); }} />)}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#C75A36' }}>{error}</Text>}
  </View>;
}
