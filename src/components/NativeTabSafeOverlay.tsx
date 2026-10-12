import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-screens/experimental';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

export function usesLiquidGlassTabs() {
  return Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
}

// The system safe area includes the native tab bar. Keep the map full-screen,
// but position controls within the remaining area without hardcoded bar heights.
export default function NativeTabSafeOverlay({ children, onHeight }: { children: React.ReactNode; onHeight(height: number): void }) {
  const insets=useSafeAreaInsets();
  if (!usesLiquidGlassTabs()) return <>{children}</>;
  // iPad's native tab strip is at the top; the experimental bottom-only safe
  // area reports an oversized obstruction there. Use the physical bottom inset.
  if(Platform.OS==='ios'&&Platform.isPad)return <View pointerEvents="box-none" style={[StyleSheet.absoluteFill,{paddingBottom:insets.bottom}]}><View pointerEvents="box-none" style={{flex:1}} onLayout={event=>onHeight(event.nativeEvent.layout.height)}>{children}</View></View>;
  return <SafeAreaView pointerEvents="box-none" edges={{ bottom: true }} style={StyleSheet.absoluteFill}>
    <View pointerEvents="box-none" style={{ flex: 1 }} onLayout={event => onHeight(event.nativeEvent.layout.height)}>{children}</View>
  </SafeAreaView>;
}
