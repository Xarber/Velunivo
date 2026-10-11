import AppIntroduction from '../components/AppIntroduction';
import {subscribeDataChange} from '../services/dataChange';
import ShortRideNotice from '../components/ShortRideNotice';
import React,{useEffect,useState} from 'react';
import {useLanguage,loadLanguage} from '../i18n/react';
import {t,notifySystemLanguage} from '../i18n/core';
import {BluetoothProvider} from '../bluetooth/react';
import BatteryUsagePrompt from '../components/BatteryUsagePrompt';
import PwaLifecycle from '../components/PwaLifecycle';
import GlassSurface from '../components/GlassSurface';
import { StyleSheet,Platform,AppState } from 'react-native';
import WebMotion from '../components/WebMotion';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { usesLiquidGlassTabs } from '../components/NativeTabSafeOverlay';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../services/store';
import { usePalette } from '../components/ui';
export default function Layout() {
  const [dataEpoch,setDataEpoch]=useState(0);useEffect(()=>subscribeDataChange(()=>setDataEpoch(v=>v+1)),[]);const p = usePalette();const language=useLanguage();useEffect(()=>{void loadLanguage();const state=AppState.addEventListener('change',s=>{if(s==='active')notifySystemLanguage();});if(Platform.OS==='web')window.addEventListener('languagechange',notifySystemLanguage);return()=>{state.remove();if(Platform.OS==='web')window.removeEventListener('languagechange',notifySystemLanguage);};},[]);useEffect(()=>{if(Platform.OS==='web')document.documentElement.lang=language.language;},[language.choice,language.language]);
  return <StoreProvider key={dataEpoch}><BluetoothProvider><AppIntroduction /><BatteryUsagePrompt /><ShortRideNotice /><PwaLifecycle /><WebMotion /><StatusBar style={p.dark ? 'light' : 'dark'} />{usesLiquidGlassTabs() ? <NativeTabs tintColor={p.accent}><NativeTabs.Trigger name="index" disableAutomaticContentInsets><NativeTabs.Trigger.Icon sf={{ default: 'location', selected: 'location.fill' }} /><NativeTabs.Trigger.Label>{t('Explore')}</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="offline"><NativeTabs.Trigger.Icon sf={{ default: 'arrow.down.circle', selected: 'arrow.down.circle.fill' }} /><NativeTabs.Trigger.Label>{t('Library')}</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="scooter"><NativeTabs.Trigger.Icon sf="bicycle" /><NativeTabs.Trigger.Label>{t('Vehicles')}</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="settings"><NativeTabs.Trigger.Icon sf="gearshape" /><NativeTabs.Trigger.Label>{t('Settings')}</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="share" hidden /></NativeTabs> : <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: p.accent, tabBarInactiveTintColor: p.muted, tabBarBackground: () => <GlassSurface style={[StyleSheet.absoluteFill, { borderRadius: 0 }]} />, tabBarStyle: { backgroundColor: 'transparent', borderTopColor: p.line }, tabBarLabelStyle: { fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: t('Explore'), tabBarIcon: ({ color, size }) => <Ionicons name="navigate" color={color} size={size} /> }} />
    <Tabs.Screen name="offline" options={{ title: t('Library'), tabBarIcon: ({ color, size }) => <Ionicons name="download-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="scooter" options={{ title: t('Vehicles'), tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="settings" options={{ title: t('Settings'), tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="share" options={{href:null}} />
  </Tabs>}</BluetoothProvider></StoreProvider>;
}
