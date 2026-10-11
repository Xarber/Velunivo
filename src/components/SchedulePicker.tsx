import {t,languageTag} from '../i18n/core';
import Text from './LocalizedText';
import React from 'react';
import {Platform, View} from 'react-native';
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
  return <View style={{ gap: 8 }}><Text style={{ color: p.muted, fontSize: 12 }}>LOCAL DATE & TIME</Text>{Platform.OS === 'ios' ? <DateTimePicker accessibilityLabel={t("Scheduled date and time")} value={date} locale={languageTag()} mode="datetime" display="compact" accentColor={p.accent} onChange={(_, selected) => { if (selected) onChange(localDateTime(selected)); }} /> : <Button title={t(value ? date.toLocaleString(languageTag()) : 'Choose date & time')} secondary onPress={android} />}{value && <Button title={t("Clear schedule · ride now")} secondary icon="close-circle-outline" onPress={() => onChange('')} />}</View>;
}
