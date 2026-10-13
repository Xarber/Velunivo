import React from 'react';
import {StyleSheet} from 'react-native';
import {Tabs} from 'expo-router';
import {NativeTabs} from 'expo-router/unstable-native-tabs';
import {Ionicons} from '@expo/vector-icons';
import GlassSurface from '../../components/GlassSurface';
import {usesLiquidGlassTabs} from '../../components/NativeTabSafeOverlay';
import {usePalette} from '../../components/ui';
import {t} from '../../i18n/core';
export default function MainTabs(){const p=usePalette();return usesLiquidGlassTabs() ? <NativeTabs tintColor={p.accent}><NativeTabs.Trigger name="index" disableAutomaticContentInsets><NativeTabs.Trigger.Icon sf={{ default: 'location', selected: 'location.fill' }} /><NativeTabs.Trigger.Label>{t('Explore')}</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="offline"><NativeTabs.Trigger.Icon sf={{ default: 'arrow.down.circle', selected: 'arrow.down.circle.fill' }} /><NativeTabs.Trigger.Label>{t('Library')}</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="scooter"><NativeTabs.Trigger.Icon sf="bicycle" /><NativeTabs.Trigger.Label>{t('Vehicles')}</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="settings"><NativeTabs.Trigger.Icon sf="gearshape" /><NativeTabs.Trigger.Label>{t('Settings')}</NativeTabs.Trigger.Label></NativeTabs.Trigger></NativeTabs> : <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: p.accent, tabBarInactiveTintColor: p.muted, tabBarBackground: () => <GlassSurface style={[StyleSheet.absoluteFill, { borderRadius: 0 }]} />, tabBarStyle: { backgroundColor: 'transparent', borderTopColor: p.line }, tabBarLabelStyle: { fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: t('Explore'), tabBarIcon: ({ color, size }) => <Ionicons name="navigate" color={color} size={size} /> }} />
    <Tabs.Screen name="offline" options={{ title: t('Library'), tabBarIcon: ({ color, size }) => <Ionicons name="download-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="scooter" options={{ title: t('Vehicles'), tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="settings" options={{ title: t('Settings'), tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} /> }} />
  </Tabs>;}
