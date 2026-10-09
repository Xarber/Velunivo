import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useStore } from '../services/store';
import { usePalette } from './ui';
import { Vehicle } from '../core/types';
import { Ionicons } from '@expo/vector-icons';
import { photoUri } from '../services/vehiclePhotos';
import { motionProps } from './WebMotion';
export function VehicleIcon({ vehicle, size = 38 }: { vehicle: Vehicle; size?: number }) {
  const [failed, setFailed] = useState<string | null>(null);
  return vehicle.photo && failed !== vehicle.photo ? <Image accessibilityLabel={`${vehicle.name} photo`} source={{ uri: photoUri(vehicle.photo) }} onError={() => setFailed(vehicle.photo)} style={{ width: size, height: size, borderRadius: 10 }} resizeMode="cover" /> : <Text accessibilityLabel={vehicle.kind === 'ebike' ? 'E-bike icon' : 'E-scooter icon'} style={{ fontSize: size * .7 }}>{vehicle.icon}</Text>;
}
export default function VehicleSelector({ disabled = false }: { disabled?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { profile, vehicles, chooseVehicle, vehicleLocked, navigationOptions } = useStore(), p = usePalette();
  disabled = disabled || vehicleLocked;
  return <View style={{ gap: 10 }}><Pressable accessibilityRole="button" accessibilityLabel="Choose ride vehicle" accessibilityState={{ expanded }} onPress={() => setExpanded(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><VehicleIcon vehicle={profile} /><View style={{ flex: 1 }}><Text style={{ color: p.text, fontWeight: '700' }}>{profile.name}</Text><Text style={{ color: p.muted, fontSize: 12 }}>Hardware {(profile.maxSpeed / (navigationOptions.unit === 'mi' ? 1.609344 : 1)).toFixed(0)} · Riding {(profile.ridingLimit / (navigationOptions.unit === 'mi' ? 1.609344 : 1)).toFixed(0)} {navigationOptions.unit === 'mi' ? 'mph' : 'km/h'}</Text></View><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={p.accent} /></Pressable>{expanded && <View style={{ gap: 8 }}>{vehicles.map(v => <Pressable {...motionProps('button')} key={v.id} accessibilityRole="button" accessibilityLabel={`Use ${v.name}`} accessibilityState={{ selected: v.id === profile.id, disabled }} disabled={disabled} onPress={() => { chooseVehicle(v.id); setExpanded(false); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderRadius: 16, backgroundColor: p.card, borderWidth: 2, borderColor: v.id === profile.id ? p.accent : p.line }}><VehicleIcon vehicle={v} /><View style={{ flex: 1 }}><Text style={{ color: p.text, fontWeight: '700' }}>{v.name || 'Unnamed vehicle'}</Text><Text style={{ color: p.muted, fontSize: 11 }}>{v.kind === 'ebike' ? 'E-bike' : 'E-scooter'} · {(Math.min(v.maxSpeed, v.ridingLimit) / (navigationOptions.unit === 'mi' ? 1.609344 : 1)).toFixed(0)} {navigationOptions.unit === 'mi' ? 'mph' : 'km/h'}</Text></View></Pressable>)}</View>}</View>;
}
