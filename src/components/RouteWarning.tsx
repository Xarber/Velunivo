import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Button, usePalette } from './ui';
import { useReducedMotion } from './WebMotion';
import { Route } from '../core/types';
export default function RouteWarning({ route, onCancel, onConfirm }: { route: Route | null; onCancel(): void; onConfirm(route: Route): void }) {
  return <NavigationWarning visible={!!route} title="Review route restrictions" messages={route?.safetyWarnings ?? []} description="This route may be unsafe or prohibited for your vehicle. Continuing does not establish permission to ride. Check signs and local rules, and walk or choose another route where needed." confirmLabel="I understand · continue" onCancel={onCancel} onConfirm={() => { if (route) onConfirm(route); }} />;
}
export function NavigationWarning({ visible, title, messages, description, confirmLabel, onCancel, onConfirm, children, disabled = false, cancelLabel = 'Choose another route' }: { visible: boolean; title: string; messages: string[]; description: string; confirmLabel: string; onCancel(): void; onConfirm(): void; children?: React.ReactNode; disabled?: boolean; cancelLabel?: string }) {
  const p = usePalette(), reduced = useReducedMotion();
  const [remaining, setRemaining] = useState(3);
  useEffect(() => {
    if (!visible) return;
    const deadline = Date.now() + 3000;
    const tick = setInterval(() => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 100);
    return () => clearInterval(tick);
  }, [visible]);
  // Parent keys the dialog by route so each new warning starts at three seconds.
  return <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onCancel}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000080' }}>
      <ScrollView accessibilityViewIsModal style={{ maxWidth: 480, maxHeight: '95%', width: '100%', alignSelf: 'center', borderRadius: 26, backgroundColor: p.bg }} contentContainerStyle={{ padding: 24, gap: 18 }}>
        <Text accessibilityRole="header" style={{ color: p.text, fontWeight: '800', fontSize: 24 }}>{title}</Text>
        <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 12 }}>{messages.map(w => <Text key={w} style={{ color: p.text, lineHeight: 22 }}>⚠ {w}</Text>)}</ScrollView>
        <Text style={{ color: p.muted, lineHeight: 21 }}>{description}</Text>
        {children}
        <Button title={cancelLabel} secondary onPress={onCancel} />
        <Pressable accessibilityRole="button" accessibilityLabel={remaining ? `Continue available in ${remaining} seconds` : confirmLabel} disabled={remaining > 0 || disabled} onPress={() => { if (remaining === 0 && !disabled) onConfirm(); }} style={[styles.confirm, { opacity: remaining || disabled ? .45 : 1 }]}><Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>{remaining ? `Continue in ${remaining}s` : confirmLabel}</Text></Pressable>
      </ScrollView>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({ confirm: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C82D3F', paddingHorizontal: 12 } });
