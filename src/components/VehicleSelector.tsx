import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useStore } from '../services/store';
import { usePalette } from './ui';
import { Vehicle } from '../core/types';
import { motionProps } from './WebMotion';
export function VehicleIcon({ vehicle, size = 38 }: { vehicle: Vehicle; size?: number }) {
  const [failed, setFailed] = useState<string | null>(null);
  return vehicle.photo && failed !== vehicle.photo ? <Image accessibilityLabel={`${vehicle.name} photo`} source={{ uri: vehicle.photo }} onError={() => setFailed(vehicle.photo)} style={{ width: size, height: size, borderRadius: 10 }} resizeMode="cover" /> : <Text accessibilityLabel={vehicle.kind === 'ebike' ? 'E-bike icon' : 'E-scooter icon'} style={{ fontSize: size * .7 }}>{vehicle.icon}</Text>;
}
export default function VehicleSelector({ disabled = false }: { disabled?: boolean }) {
  const { profile, vehicles, chooseVehicle, vehicleLocked } = useStore(), p = usePalette();
  disabled = disabled || vehicleLocked;
  return <View style={{ gap: 8 }}><Text style={{ color: p.muted, fontSize: 11, fontWeight: '700' }}>CURRENT VEHICLE{disabled ? ' · RIDE IN PROGRESS' : ''}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{vehicles.map(v => <Pressable {...motionProps('button')} key={v.id} accessibilityRole="button" accessibilityLabel={`Use ${v.name}`} accessibilityState={{ selected: v.id === profile.id, disabled }} disabled={disabled} onPress={() => chooseVehicle(v.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderRadius: 16, backgroundColor: p.card, borderWidth: 2, borderColor: v.id === profile.id ? p.accent : p.line }}><VehicleIcon vehicle={v} /><View><Text style={{ color: p.text, fontWeight: '700' }}>{v.name || 'Unnamed vehicle'}</Text><Text style={{ color: p.muted, fontSize: 11 }}>{v.kind === 'ebike' ? 'E-bike' : 'E-scooter'} · {Math.min(v.maxSpeed, v.ridingLimit)} km/h</Text></View></Pressable>)}</ScrollView></View>;
}
