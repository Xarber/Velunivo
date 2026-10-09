import React, { useState } from 'react';
import { View, Text } from 'react-native';
import SchedulePicker from './SchedulePicker';
import { Button, Field, usePalette } from './ui';
import { localDateTime, parseSchedule } from '../core/schedule';
export default function ScheduleControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const p = usePalette(), [phrase, setPhrase] = useState(''), [error, setError] = useState('');
  function apply() { try { onChange(localDateTime(parseSchedule(phrase))); setError(''); } catch (e) { setError((e as Error).message); } }
  return <View style={{ gap: 8 }}><SchedulePicker value={value} onChange={v => { try { if (v) parseSchedule(v); onChange(v); setError(''); } catch (e) { setError((e as Error).message); } }} /><Field label="OR DESCRIBE WHEN" placeholder="Today at 9:00 · in 3 hours and 35 minutes" value={phrase} onChangeText={setPhrase} /><Button title="Use this time" secondary onPress={apply} />{!!error && <Text accessibilityRole="alert" style={{ color: '#C75A36', fontSize: 12 }}>{error}</Text>}{value && <Text style={{ color: p.muted, fontSize: 12 }}>Scheduled for {parseSchedule(value).toLocaleString()} · {Intl.DateTimeFormat().resolvedOptions().timeZone}</Text>}</View>;
}
