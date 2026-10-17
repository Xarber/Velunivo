import KeyboardPage from '../components/KeyboardPage';
import CosmeticThemeProvider from '../components/CosmeticThemeProvider';
import {GroupProvider} from '../groups/GroupProvider';
import PairedDeviceSync from '../components/PairedDeviceSync';
import AppIntroduction from '../components/AppIntroduction';
import ScratchRecap from '../components/ScratchRecap';
import {subscribeDataChange} from '../services/dataChange';
import ShortRideNotice from '../components/ShortRideNotice';
import React,{useEffect,useState} from 'react';
import {useLanguage,loadLanguage} from '../i18n/react';
import {notifySystemLanguage} from '../i18n/core';
import {BluetoothProvider} from '../bluetooth/react';
import BatteryUsagePrompt from '../components/BatteryUsagePrompt';
import PwaLifecycle from '../components/PwaLifecycle';
import { Platform,AppState } from 'react-native';
import WebMotion from '../components/WebMotion';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../services/store';
import { usePalette } from '../components/ui';
export default function Layout() {
  const [dataEpoch,setDataEpoch]=useState(0);useEffect(()=>subscribeDataChange(()=>setDataEpoch(v=>v+1)),[]);const p = usePalette();const language=useLanguage();useEffect(()=>{void loadLanguage();const state=AppState.addEventListener('change',s=>{if(s==='active')notifySystemLanguage();});if(Platform.OS==='web')window.addEventListener('languagechange',notifySystemLanguage);return()=>{state.remove();if(Platform.OS==='web')window.removeEventListener('languagechange',notifySystemLanguage);};},[]);useEffect(()=>{if(Platform.OS==='web')document.documentElement.lang=language.language;},[language.choice,language.language]);
  return <><PairedDeviceSync/><StoreProvider key={dataEpoch}><CosmeticThemeProvider><BluetoothProvider><GroupProvider><AppIntroduction /><ScratchRecap/><BatteryUsagePrompt /><ShortRideNotice /><PwaLifecycle /><WebMotion /><StatusBar style={p.dark ? 'light' : 'dark'} /><KeyboardPage><Stack screenOptions={{headerShown:false}}><Stack.Screen name="(tabs)"/><Stack.Screen name="share"/></Stack></KeyboardPage></GroupProvider></BluetoothProvider></CosmeticThemeProvider></StoreProvider></>;
}
