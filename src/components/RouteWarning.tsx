import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Button, usePalette } from './ui';
import { useReducedMotion } from './WebMotion';
import { Route } from '../core/types';
export default function RouteWarning({ route, onCancel, onConfirm }: { route: Route | null; onCancel(): void; onConfirm(route: Route): void }) {
  const p = usePalette(), reduced = useReducedMotion();
  const [remaining, setRemaining] = useState(3);
  useEffect(() => {
    if (!route) return;
    const deadline = Date.now() + 3000;
    const tick = setInterval(() => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 100);
    return () => clearInterval(tick);
  }, [route]);
  // Parent keys the dialog by route so each new warning starts at three seconds.
  return <Modal visible={!!route} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onCancel}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000080' }}>
      <View accessibilityViewIsModal style={{ maxWidth: 480, width: '100%', alignSelf: 'center', padding: 24, borderRadius: 26, backgroundColor: p.bg, gap: 18 }}>
        <Text accessibilityRole="header" style={{ color: p.text, fontWeight: '800', fontSize: 24 }}>Review route restrictions</Text>
        <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 12 }}>{route?.safetyWarnings?.map(w => <Text key={w} style={{ color: p.text, lineHeight: 22 }}>⚠ {w}</Text>)}</ScrollView>
        <Text style={{ color: p.muted, lineHeight: 21 }}>This route may be unsafe or prohibited for your vehicle. Continuing does not establish permission to ride. Check signs and local rules, and walk or choose another route where needed.</Text>
        <Button title="Choose another route" secondary onPress={onCancel} />
        <Pressable accessibilityRole="button" accessibilityLabel={remaining ? `Continue available in ${remaining} seconds` : 'I understand · continue'} disabled={remaining > 0} onPress={() => { if (route && remaining === 0) onConfirm(route); }} style={[styles.confirm, { opacity: remaining ? .45 : 1 }]}><Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>{remaining ? `Continue in ${remaining}s` : 'I understand · continue'}</Text></Pressable>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({ confirm: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C82D3F', paddingHorizontal: 12 } });
