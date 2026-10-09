import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, ViewProps, useColorScheme } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import MotionView from './MotionView';
export default function GlassSurface({ children, style, interactive = false, ...props }: ViewProps & { interactive?: boolean }) {
  const dark = useColorScheme() === 'dark';
  const [opaque, setOpaque] = useState(true);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(value => { if (alive) setOpaque(value); }).catch(() => { if (alive) setOpaque(false); });
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setOpaque);
    return () => { alive = false; sub.remove(); };
  }, []);
  const liquid = Platform.OS === 'ios' && !opaque && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  const radius = StyleSheet.flatten(style)?.borderRadius ?? 24;
  return <MotionView {...props} style={[style, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
    {liquid ? <GlassView pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius }]} glassEffectStyle="regular" isInteractive={interactive} /> : Platform.OS === 'ios' && !opaque ? <BlurView pointerEvents="none" tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} intensity={85} style={StyleSheet.absoluteFill} /> : <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? '#172A31F0' : '#FFFFFFF0', borderRadius: radius, borderWidth: 1, borderColor: dark ? '#FFFFFF18' : '#FFFFFFAA' }]} />}
    {children}
  </MotionView>;
}
