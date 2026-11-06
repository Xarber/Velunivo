import LockedCredentialSettings from './LockedCredentialSettings';
import {armAutomaticRideWake,stopAutomaticRideWake} from '../services/automaticRideWake';
// SPDX-License-Identifier: AGPL-3.0-only
import React,{useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform,Switch,View} from 'react-native';
import {useBluetoothPreferences} from '../bluetooth/react';
import {useStore} from '../services/store';
import {prepareAutomaticRide} from '../services/automaticRidePermissions';
import {t} from '../i18n/core';
import Text from './LocalizedText';
import InfoButton from './InfoButton';
import {usePalette} from './ui';
export default function AutomaticRecordingSettings(){
 const p=usePalette(),{navigationOptions:n,updateNavigationOptions,profile}=useStore();
 const {update:updateBluetooth}=useBluetoothPreferences();
 const [busy,setBusy]=useState(false),[status,setStatus]=useState('');
 async function enable(value:boolean){
  if(!value){await stopAutomaticRideWake().catch(()=>setStatus('Could not disable all wake services. Open the app and try again.'));updateNavigationOptions({autoBluetoothRecording:false});await AsyncStorage.removeItem('automatic-ride-consent-v1').catch(()=>{});return;}
  setBusy(true);
  try{const result=await prepareAutomaticRide();await AsyncStorage.setItem('automatic-ride-consent-v1','true');updateBluetooth({autoReconnect:true});updateNavigationOptions({autoBluetoothRecording:true});await armAutomaticRideWake(profile.id);setStatus(result==='background'?'Background detection is ready while connected.':result==='foreground'?'Allow Always location for automatic background recording. Otherwise, a ride alert is used.':'Allow location to record. Ride alerts also require notification permission.');}
  catch{setStatus('Could not enable automatic recording. Check location and notification permissions.');}
  finally{setBusy(false);}
 }
 return <View style={{gap:12}}><View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Text style={{flex:1,color:p.text,fontWeight:'700'}}>Automatic Bluetooth recording</Text><InfoButton title={t('Automatic Bluetooth recording')}>{t('Wakes on significant location changes, then checks your saved scooter. Coarse wake events are not recorded as rides. Timing depends on iOS.')}</InfoButton><Switch accessibilityLabel={t('Automatic Bluetooth recording')} disabled={busy||Platform.OS==='web'} value={n.autoBluetoothRecording} onValueChange={value=>void enable(value)} trackColor={{true:p.accent}}/></View>{n.autoBluetoothRecording&&<Text style={{color:p.muted,fontSize:12}}>Location wake can resume detection after a swipe-away. Always location and Background App Refresh are required; detection may be delayed.</Text>}{n.autoBluetoothRecording&&<View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Text style={{flex:1,color:p.text}}>Notify instead of recording</Text><Switch accessibilityLabel={t('Notify instead of recording')} value={n.bluetoothRecordingNotifyOnly} onValueChange={bluetoothRecordingNotifyOnly=>updateNavigationOptions({bluetoothRecordingNotifyOnly})} trackColor={{true:p.accent}}/></View>}<LockedCredentialSettings/>{!!status&&<Text style={{color:p.muted,fontSize:12}}>{status}</Text>}</View>;
}
