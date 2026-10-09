import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

export function usesLiquidGlassTabs() {
  return Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
}

// The system safe area includes the native tab bar. Keep the map full-screen,
// but position controls within the remaining area without hardcoded bar heights.
export default function NativeTabSafeOverlay({ children, onHeight }: { children: React.ReactNode; onHeight(height: number): void }) {
  if (!usesLiquidGlassTabs()) return <>{children}</>;
  return <SafeAreaView pointerEvents="box-none" edges={{ bottom: true }} style={StyleSheet.absoluteFill}>
    <View pointerEvents="box-none" style={{ flex: 1 }} onLayout={event => onHeight(event.nativeEvent.layout.height)}>{children}</View>
  </SafeAreaView>;
}
