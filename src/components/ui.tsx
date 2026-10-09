import React from 'react';
import { Pressable, Text, StyleSheet, useColorScheme, View, TextInput, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
export const usePalette = () => {
  const dark = useColorScheme() === 'dark';
  return { dark, bg: dark ? '#101B21' : '#F4F7F8', card: dark ? '#1A2930' : '#FFFFFF', text: dark ? '#F6FAFC' : '#162C35', muted: dark ? '#9BAEB6' : '#647B86', line: dark ? '#30434B' : '#E6ECEF', accent: dark ? '#64DCC5' : '#007F6D' };
};
export function Button({ title, onPress, secondary = false, disabled = false, icon }: { title: string; onPress(): void; secondary?: boolean; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  const p = usePalette();
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: secondary ? p.line : p.accent, opacity: disabled ? .4 : pressed ? .75 : 1 }]}>{icon && <Ionicons name={icon} size={19} color={secondary ? p.text : p.dark ? '#102A28' : '#fff'} />}<Text style={{ color: secondary ? p.text : p.dark ? '#102A28' : '#fff', fontSize: 16, fontWeight: '700' }}>{title}</Text></Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const p = usePalette(); return <View style={{ gap: 6 }}><Text style={{ color: p.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8 }}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={p.muted} {...props} style={[styles.field, { color: p.text, backgroundColor: p.bg, borderColor: p.line }, props.style]} /></View>;
}
export const styles = StyleSheet.create({
  button: { minHeight: 50, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  field: { borderWidth: 1, borderRadius: 13, padding: 13, fontSize: 16 },
  card: { padding: 18, borderRadius: 22, gap: 12 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: 15, lineHeight: 22 },
});
