import {useMapActions} from '../../services/mapActions';import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MapTabAccessory from '../../components/MapTabAccessory';import {useRideChrome} from '../../services/rideLock';
import React from 'react';
import {View,StyleSheet} from 'react-native';
import {Tabs,router,usePathname} from 'expo-router';
import {NativeTabs} from 'expo-router/unstable-native-tabs';
import {Ionicons} from '@expo/vector-icons';
import GlassSurface from '../../components/GlassSurface';
import {usesLiquidGlassTabs} from '../../components/NativeTabSafeOverlay';
import {Button,usePalette} from '../../components/ui';
import {t} from '../../i18n/core';
export default function MainTabs(){const actions=useMapActions(),insets=useSafeAreaInsets();const p=usePalette(),ride=useRideChrome(),path=usePathname();const tabs= usesLiquidGlassTabs() ? <NativeTabs hidden={ride.active} tintColor={p.accent}>{!ride.active&&actions&&<NativeTabs.BottomAccessory><MapTabAccessory/></NativeTabs.BottomAccessory>}<NativeTabs.Trigger name="index" disableAutomaticContentInsets><NativeTabs.Trigger.Icon sf={{ default: 'location', selected: 'location.fill' }} /><NativeTabs.Trigger.Label>{t('Explore')}</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="offline" contentStyle={{backgroundColor:p.bg}}><NativeTabs.Trigger.Icon sf={{ default: 'arrow.down.circle', selected: 'arrow.down.circle.fill' }} /><NativeTabs.Trigger.Label>{t('Library')}</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="scooter"><NativeTabs.Trigger.Icon sf="bicycle" /><NativeTabs.Trigger.Label>{t('Vehicles')}</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="settings"><NativeTabs.Trigger.Icon sf="gearshape" /><NativeTabs.Trigger.Label>{t('Settings')}</NativeTabs.Trigger.Label></NativeTabs.Trigger></NativeTabs> : <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: p.accent, tabBarInactiveTintColor: p.muted, tabBarBackground: () => <GlassSurface style={[StyleSheet.absoluteFill, { borderRadius: 0 }]} />, tabBarStyle: { display:ride.active?'none':'flex', backgroundColor: 'transparent', borderTopColor: p.line }, tabBarLabelStyle: { fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: t('Explore'), tabBarIcon: ({ color, size }) => <Ionicons name="navigate" color={color} size={size} /> }} />
    <Tabs.Screen name="offline" options={{ title: t('Library'), tabBarIcon: ({ color, size }) => <Ionicons name="download-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="scooter" options={{ title: t('Vehicles'), tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="settings" options={{ title: t('Settings'), tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} /> }} />
  </Tabs>;return <View style={{flex:1,backgroundColor:p.bg}}>{tabs}{ride.active&&path.startsWith('/settings')&&<View style={{padding:12,paddingBottom:12+insets.bottom,backgroundColor:p.bg}}><Button title={t('Back to navigation')} icon="navigate" onPress={()=>router.replace(ride.target as '/')}/></View>}</View>;}
