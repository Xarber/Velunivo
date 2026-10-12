import {t} from '../i18n/core';
import Text from './LocalizedText';
import { useStore } from '../services/store';
import { searchPlaces } from '../core/places';
import React, { useRef, useState, useEffect,useCallback } from 'react';
import {Ionicons} from '@expo/vector-icons';
import {ActivityIndicator,Keyboard, TextInput, View, Pressable} from 'react-native';
import { Button, IconButton, usePalette, styles } from './ui';
import { Coord } from '../core/types';
import { searchAddresses, AddressResult } from '../services/api';
export default function EndpointPicker({ label, value, onChange, onSelect, onMap, onLocation, onFocus, showLocation = true, disabled = false, compact = false }: { label: string; value: string; onChange(v: string): void; onSelect(label: string, coordinate: Coord): void; onMap(): void; onLocation?(): void; disabled?: boolean; onFocus?(): void; showLocation?: boolean; compact?:boolean }) {
  const { places, addPlace } = useStore();
  const p = usePalette(), [browsePlaces,setBrowsePlaces]=useState(false), [results, setResults] = useState<AddressResult[]>([]), [focused, setFocused] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const savedMatches = focused ? searchPlaces(places, browsePlaces || value === 'Current location' ? '' : value) : [];
  const focusId=useRef(0),blurTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>clearTimeout(blurTimer.current),[]);
  const searchId = useRef(0), input = useRef<TextInput>(null);
  function invalidate() { searchId.current++; setResults([]); setBusy(false); setError(''); }
  function dismiss() { input.current?.blur(); Keyboard.dismiss(); setFocused(false); setBrowsePlaces(false); }
  const search=useCallback(async()=>{ const id = ++searchId.current; setBusy(true); setError(''); setResults([]); try { const found = await searchAddresses(value); if (id !== searchId.current) return; setResults(found); if (!found.length) setError('No matching address. Add a city or choose on the map.'); } catch (e) { if (id === searchId.current) setError(e instanceof Error ? e.message : String(e)); } finally { if (id === searchId.current) setBusy(false); } },[value]);
  // Request generation is deliberately advanced during cleanup to discard late results.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{if(!focused||disabled||browsePlaces||value.trim().length<3||value==='Current location')return;const timer=setTimeout(()=>void search(),1000);return()=>{clearTimeout(timer);searchId.current++;};},[value,focused,disabled,browsePlaces,search]);
  return <View style={{ gap: compact?0:8 }}>{!compact&&<Text style={{ color: p.muted, fontSize: 12, fontWeight: '700' }}>{label.toUpperCase()}</Text>}<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: compact?0:16, paddingRight: 0, backgroundColor: p.card, borderWidth: compact?0:1, borderColor: p.line }}><TextInput ref={input} accessibilityLabel={t(label)} placeholder={compact?label:t("Address, place or coordinates")} placeholderTextColor={p.muted} value={value==='Current location'?t(value):value} editable={!disabled} onFocus={() => { focusId.current++;clearTimeout(blurTimer.current);setFocused(true); setBrowsePlaces(true);onFocus?.(); }} onBlur={()=>{const id=++focusId.current;blurTimer.current=setTimeout(()=>{if(focusId.current===id)setFocused(false);},180);}} onChangeText={v => { invalidate();setBrowsePlaces(false); onChange(v); }} onSubmitEditing={() => void search()} returnKeyType="search" style={[styles.field, { flex: 1, minWidth: 0, color: p.text, borderWidth: 0,fontSize:16,paddingHorizontal:compact?8:12 }]} />{busy&&<ActivityIndicator size="small" color={p.accent}/>}<Pressable accessibilityRole="button" accessibilityLabel={t(`Pick ${label} on map`)} disabled={disabled} onPress={()=>{invalidate();dismiss();onMap();}} style={{width:36,minHeight:44,alignItems:'center',justifyContent:'center',backgroundColor:'transparent'}}><Ionicons name="map-outline" size={21} color={p.accent}/></Pressable></View>
    {focused && showLocation && onLocation && <Button title={t("Use my location")} secondary disabled={disabled} icon="locate" onPress={() => { invalidate(); dismiss(); onLocation(); }} />}
    {savedMatches.length > 0 && <Text style={{color:p.muted,fontSize:12,fontWeight:'700'}}>SAVED PLACES</Text>}
    {savedMatches.map(r=><Pressable key={r.id} accessibilityRole="button" accessibilityLabel={t(`Choose saved place ${r.name}`)} onPress={()=>{invalidate();dismiss();onSelect(r.name,r.coordinate);}} style={{padding:12,borderRadius:16,backgroundColor:p.card,gap:4}}><Text numberOfLines={1} style={{color:p.text,fontWeight:'700'}}>{r.name}</Text><Text numberOfLines={2} style={{color:p.muted,fontSize:12}}>{r.address}</Text></Pressable>)}
    {results.map(r => <View key={`${r.label}-${r.coordinate}`} style={{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:p.card,borderRadius:16,padding:10}}><Pressable accessibilityRole="button" accessibilityLabel={t(r.label)} disabled={disabled} onPress={() => { invalidate(); dismiss(); onSelect(r.label, r.coordinate); }} style={{flex:1,gap:4}}><Text numberOfLines={2} style={{color:p.text,fontWeight:'700',fontSize:16}}>{r.name}</Text><Text style={{color:p.muted,fontSize:12,lineHeight:18}}>{r.address}</Text></Pressable><IconButton label={t(`Save ${r.name} to places`)} icon="bookmark-outline" disabled={places.some(p=>p.address===r.label)} onPress={()=>addPlace({name:r.name,address:r.label,coordinate:r.coordinate})} /></View>)}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#C75A36' }}>{error}</Text>}
  </View>;
}
