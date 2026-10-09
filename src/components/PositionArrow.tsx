import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
export default function PositionArrow({ navigating, rotation = 0 }: { navigating: boolean; rotation?: number }) {
  return <View accessibilityLabel={navigating ? 'Navigation position arrow' : 'Current position'} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 22, boxShadow: '0 2px 8px #00000035', transform: [{ rotate: `${rotation}deg` }] }}>{navigating ? <Ionicons name="navigate" size={32} color="#287CF5" style={{ transform: [{ rotate: '-45deg' }] }} /> : <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#287CF5' }} />}</View>;
}
