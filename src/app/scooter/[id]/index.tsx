import React from 'react';
import { Alert, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { VehicleIcon } from '../../../components/VehicleSelector';
import { Button, IconButton, styles, usePalette } from '../../../components/ui';
import { useStore } from '../../../services/store';
export default function EditVehicle() {
  const { id } = useLocalSearchParams<{ id: string }>(), p = usePalette(), { vehicles, deleteVehicle, vehicleLocked } = useStore();
  const v = vehicles.find(v => v.id === id);
  const remove = () => { const act = () => { deleteVehicle(id); router.replace('/scooter'); }; if (Platform.OS === 'web') { if (window.confirm('Delete this vehicle? Saved routes and recorded rides will remain.')) act(); } else Alert.alert('Delete vehicle?', 'Saved routes and recorded rides will remain.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: act }]); };
  return <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}><ScrollView contentContainerStyle={{ padding: 24, gap: 18, width: '100%', maxWidth: 700, alignSelf: 'center', paddingBottom: 90 }}><View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><IconButton label="Back to vehicles" icon="chevron-back" onPress={() => router.replace('/scooter')} /><Text style={[styles.title, { color: p.text, flex: 1 }]}>{v?.name || 'Vehicle removed'}</Text>{v && <IconButton label="Delete vehicle" icon="trash-outline" disabled={vehicleLocked || vehicles.length <= 1} onPress={remove} />}</View>{v && <><View style={[styles.card, { backgroundColor: p.card, alignItems: 'center' }]}><VehicleIcon vehicle={v} size={120} /><Text style={{ color: p.muted }}>{v.kind === 'ebike' ? 'E-bike' : 'E-scooter'}</Text></View>{vehicleLocked && <Text style={{ color: p.muted }}>Vehicle editing is locked during your ride.</Text>}{([{ section: 'identity', title: 'Name & speed limits', icon: 'speedometer-outline' }, { section: 'range', title: 'Range & battery', icon: 'battery-half-outline' }, { section: 'appearance', title: 'Icon & pictures', icon: 'images-outline' }, { section: 'tuning', title: 'ETA tuning', icon: 'options-outline' }] as const).map(menu => <Button key={menu.section} title={menu.title} icon={menu.icon} secondary onPress={() => router.push(`/scooter/${id}/${menu.section}`)} />)}</>}</ScrollView></SafeAreaView>;
}
