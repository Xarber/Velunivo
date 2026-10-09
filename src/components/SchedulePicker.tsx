import React from 'react';
import { Platform, View, Text } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Button, usePalette } from './ui';
import { localDateTime, parseSchedule } from '../core/schedule';
export interface SchedulePickerProps { value: string; onChange: (value: string) => void; }
export default function SchedulePicker({ value, onChange }: SchedulePickerProps) {
  const p = usePalette();
  const date = value ? parseSchedule(value) : new Date();
  function android() {
    DateTimePickerAndroid.open({ value: date, mode: 'date', onChange: (event, day) => {
      if (event.type !== 'set' || !day) return;
      DateTimePickerAndroid.open({ value: date, mode: 'time', onChange: (ev, time) => {
        if (ev.type !== 'set' || !time) return;
        const result = new Date(day); result.setHours(time.getHours(), time.getMinutes(), 0, 0); onChange(localDateTime(result));
      } });
    } });
  }
  return <View style={{ gap: 8 }}><Text style={{ color: p.muted, fontSize: 12 }}>LOCAL DATE & TIME</Text>{Platform.OS === 'ios' ? <DateTimePicker accessibilityLabel="Scheduled date and time" value={date} mode="datetime" display="compact" accentColor={p.accent} onChange={(_, selected) => { if (selected) onChange(localDateTime(selected)); }} /> : <Button title={value ? date.toLocaleString() : 'Choose date & time'} secondary onPress={android} />}<Button title="Clear schedule · ride now" secondary onPress={() => onChange('')} /></View>;
}
