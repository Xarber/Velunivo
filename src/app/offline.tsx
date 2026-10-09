import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Button, styles, usePalette } from '../components/ui';
import { useStore } from '../services/store';
import { packs, download, deletePack, listen, unlisten, PackView } from '../services/offline';
import { offlineEnabled } from '../components/mapConfig';
import { estimate, km, minutes } from '../core/eta';
export default function Library() {
  const p = usePalette(), { saved, selected, select, setRoutes, remove, profile } = useStore();
  const [regions, setRegions] = useState<PackView[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const attached = useRef<string[]>([]), mounted = useRef(true);
  const refresh = useCallback(async () => {
    const all = await packs(); if (!mounted.current) return; setRegions(all);
    for (const r of all) if (!attached.current.includes(r.id)) { attached.current.push(r.id); await listen(r.id, (_, status) => { if (mounted.current) setRegions(v => v.map(x => x.id === status.id ? { ...x, percentage: status.percentage, bytes: status.completedResourceSize, state: status.state } : x)); }, msg => { if (mounted.current) setError(msg); }); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh().catch(e => setError(e.message)); }, [refresh]));
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; attached.current.forEach(unlisten); }; }, []);
  async function run(fn: () => Promise<unknown>) { setError(''); try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } }
  function deleteRegion(id: string) {
    const act = () => void run(async () => { unlisten(id); attached.current = attached.current.filter(x => x !== id); await deletePack(id); await refresh(); });
    if (Platform.OS === 'web') { if (window.confirm('Delete this downloaded map region?')) act(); } else Alert.alert('Delete map region?', 'You can download it again later.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: act }]);
  }
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: p.bg }}><ScrollView contentContainerStyle={{ padding: 22, gap: 18, width: '100%', maxWidth: 780, alignSelf: 'center' }}>
    <Text style={[styles.title, { color: p.text }]}>Ready, even offline.</Text><Text style={[styles.subtitle, { color: p.muted }]}>Save a route before you ride. Its geometry, turns and ETA stay on this device.</Text>
    <Text style={{ color: p.text, fontSize: 20, fontWeight: '800' }}>Saved routes</Text>
    {saved.length === 0 && <View style={[styles.card, { backgroundColor: p.card }]}><Text style={{ color: p.muted }}>No saved routes yet. Import and save your own GPX or save a planned route from Explore.</Text></View>}
    {saved.map(r => { const e = estimate(r, profile); return <View key={r.id} style={[styles.card, { backgroundColor: p.card }]}><Text style={{ color: p.text, fontWeight: '700', fontSize: 18 }}>{r.name}</Text><Text style={{ color: p.muted }}>{km(e.meters)} · {minutes(e.seconds)} · {r.steps.length ? `${r.steps.length} instructions` : 'Track only'}</Text><View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Button title="Open" onPress={() => { setRoutes([r]); select(r); router.navigate('/'); }} /></View><Button title="Remove" secondary onPress={() => void run(() => remove(r.id))} /></View></View>; })}
    <Text style={{ color: p.text, fontSize: 20, fontWeight: '800' }}>Downloaded maps</Text>
    <View style={[styles.card, { backgroundColor: p.card }]}><Text style={{ color: p.text, fontWeight: '700' }}>Map region for your selected route</Text><Text style={{ color: p.muted, lineHeight: 20 }}>{Platform.OS === 'web' ? 'Downloads are available in the native app.' : !offlineEnabled ? 'Downloads need an offline-licensed map provider configured during setup.' : 'Downloads the route bounding box plus a small margin, zooms 10–16. Download on Wi-Fi; size depends on the region.'}</Text><Button title={busy ? 'Creating download…' : 'Download selected region'} disabled={busy || !selected || !offlineEnabled || Platform.OS === 'web'} icon="download-outline" onPress={() => void run(async () => { setBusy(true); try { await download(selected!, () => { void refresh().catch(e => setError(e.message)); }, setError); await refresh(); } finally { setBusy(false); } })} /></View>
    {regions.map(r => <View key={r.id} style={[styles.card, { backgroundColor: p.card }]}><Text style={{ color: p.text, fontWeight: '700' }}>{r.name}</Text><Text style={{ color: p.muted }}>{r.state} · {r.percentage.toFixed(0)}% · {(r.bytes / 1e6).toFixed(1)} MB downloaded</Text><View style={{ height: 5, backgroundColor: p.line, borderRadius: 5 }}><View style={{ height: 5, width: `${Math.min(100, r.percentage)}%`, backgroundColor: p.accent, borderRadius: 5 }} /></View><View style={{ flexDirection: 'row', gap: 10 }}>{r.state !== 'complete' && <Button title={r.state === 'active' ? 'Pause' : 'Resume'} secondary onPress={() => void run(async () => { if (r.state === 'active') await r.pack.pause(); else await r.pack.resume(); await refresh(); })} />}<Button title="Delete" secondary onPress={() => deleteRegion(r.id)} /></View></View>)}
    {!!error && <Text style={{ color: '#C75A36' }}>{error}</Text>}
    <Text style={{ color: p.muted, lineHeight: 21 }}>Android uses OpenFreeMap with MapLibre. On iOS, choose Use downloadable maps in Explore to view downloaded regions; Apple Maps does not expose app-managed region downloads. Offline maps contain map resources, not a routing graph. Saved-route guidance works without new route requests. Planning and rerouting require a connection; on-device route calculation is future work.</Text>
  </ScrollView></SafeAreaView>;
}
