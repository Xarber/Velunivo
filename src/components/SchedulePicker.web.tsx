import React from 'react';
import { View, Text } from 'react-native';
import { Button, usePalette } from './ui';
import { SchedulePickerProps } from './SchedulePicker';
export default function SchedulePicker({ value, onChange }: SchedulePickerProps) {
  const p = usePalette();
  return <View style={{ gap: 8 }}><Text style={{ color: p.muted, fontSize: 12 }}>LOCAL DATE & TIME</Text><input aria-label="Scheduled date and time" type="datetime-local" value={value} onChange={e => onChange(e.target.value)} onInput={e => onChange(e.currentTarget.value)} style={{ color: p.text, background: p.card, border: `1px solid ${p.line}`, borderRadius: 14, padding: 14, fontSize: 16, colorScheme: p.dark ? 'dark' : 'light', width: '100%', boxSizing: 'border-box' }} /><Button title="Clear schedule · ride now" secondary onPress={() => onChange('')} /></View>;
}
