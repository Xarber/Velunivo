import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

export function usesLiquidGlassTabs() {
  return Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
}

// The system safe area includes the native tab bar. Keep the map full-screen,
// but position controls within the remaining area without hardcoded bar heights.
export default function NativeTabSafeOverlay({ children, onHeight }: { children: React.ReactNode; onHeight(height: number): void }) {
  const insets=useSafeAreaInsets();
  return <View pointerEvents="box-none" style={[StyleSheet.absoluteFill,{paddingBottom:insets.bottom}]}><View pointerEvents="box-none" style={{flex:1,minHeight:0}} onLayout={event=>onHeight(event.nativeEvent.layout.height)}>{children}</View></View>;
}
