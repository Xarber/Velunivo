import React, { useState } from 'react';
import { View, Text } from 'react-native';
import SchedulePicker from './SchedulePicker';
import { usePalette } from './ui';
import { parseSchedule } from '../core/schedule';
export default function ScheduleControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const p = usePalette(), [error, setError] = useState('');
  return <View style={{ gap: 8 }}><SchedulePicker value={value} onChange={v => { try { if (v) parseSchedule(v); onChange(v); setError(''); } catch (e) { setError((e as Error).message); } }} />{!!error && <Text accessibilityRole="alert" style={{ color: '#C75A36', fontSize: 12 }}>{error}</Text>}{value && <Text style={{ color: p.muted, fontSize: 12 }}>Scheduled for {parseSchedule(value).toLocaleString()} · {Intl.DateTimeFormat().resolvedOptions().timeZone}</Text>}</View>;
}
