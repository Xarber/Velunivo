import React from 'react';
import { Stack } from 'expo-router';
import { usePalette } from '../../components/ui';
export default function VehicleLayout() { const p = usePalette(); return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }} />; }
