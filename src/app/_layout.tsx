import React from 'react';
import GlassSurface from '../components/GlassSurface';
import { StyleSheet } from 'react-native';
import WebMotion from '../components/WebMotion';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { usesLiquidGlassTabs } from '../components/NativeTabSafeOverlay';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../services/store';
import { usePalette } from '../components/ui';
export default function Layout() {
  const p = usePalette();
  return <StoreProvider><WebMotion /><StatusBar style={p.dark ? 'light' : 'dark'} />{usesLiquidGlassTabs() ? <NativeTabs tintColor={p.accent}><NativeTabs.Trigger name="index" disableAutomaticContentInsets><NativeTabs.Trigger.Icon sf={{ default: 'location', selected: 'location.fill' }} /><NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="offline"><NativeTabs.Trigger.Icon sf={{ default: 'arrow.down.circle', selected: 'arrow.down.circle.fill' }} /><NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="scooter"><NativeTabs.Trigger.Icon sf="bicycle" /><NativeTabs.Trigger.Label>Vehicles</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="settings"><NativeTabs.Trigger.Icon sf="gearshape" /><NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label></NativeTabs.Trigger></NativeTabs> : <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: p.accent, tabBarInactiveTintColor: p.muted, tabBarBackground: () => <GlassSurface style={[StyleSheet.absoluteFill, { borderRadius: 0 }]} />, tabBarStyle: { backgroundColor: 'transparent', borderTopColor: p.line }, tabBarLabelStyle: { fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: 'Explore', tabBarIcon: ({ color, size }) => <Ionicons name="navigate" color={color} size={size} /> }} />
    <Tabs.Screen name="offline" options={{ title: 'Library', tabBarIcon: ({ color, size }) => <Ionicons name="download-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="scooter" options={{ title: 'Vehicles', tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} /> }} />
  </Tabs>}</StoreProvider>;
}
