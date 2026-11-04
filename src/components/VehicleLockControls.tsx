import {safeStationary} from '../bluetooth/plugins/m365ControlPolicy';
import React,{useState,useEffect} from 'react';
import {router} from 'expo-router';
import {View} from 'react-native';
import {bluetoothBridge} from '../bluetooth/service';
import {useBluetoothVehicle} from '../bluetooth/react';
import {Button,IconButton,usePalette} from './ui';
import Text from './LocalizedText';
import {t} from '../i18n/core';
export default function VehicleLockControls({vehicleId,inset=false}:{vehicleId:string;inset?:boolean}){
 const s=useBluetoothVehicle(vehicleId),p=usePalette(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(()=>Date.now());useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 if(s.vehicleId!==vehicleId||s.state!=='connected'||s.simulated||!s.capabilities?.commands.includes('lock'))return null;
 const locked=s.extensions.locked,known=locked&&now-locked.timestamp<60000;
 async function command(value:boolean){setBusy(true);setError('');try{await bluetoothBridge.setLocked(vehicleId,value);}catch(e){setError(e instanceof Error?e.message:'Vehicle lock state could not be verified.');}finally{setBusy(false);}}
 return <View style={{gap:8,...(inset?{paddingHorizontal:16,paddingBottom:8}:{})}}><View style={{flexDirection:'row',gap:8}}>{(!known||!locked.value)&&<View style={{flex:1}}><Button title={t('Lock vehicle')} icon="lock-closed-outline" secondary disabled={busy||!safeStationary(s,now)} onPress={()=>void command(true)}/></View>}{(!known||locked.value)&&<View style={{flex:1}}><Button title={t('Unlock vehicle')} icon="lock-open-outline" secondary disabled={busy||!safeStationary(s,now)} onPress={()=>void command(false)}/></View>}<IconButton label={t('Scooter controls')} icon="options-outline" onPress={()=>router.push(`/scooter/${vehicleId}/controls`)}/></View>{!safeStationary(s,now)&&<Text style={{color:p.muted,fontSize:12}}>Stop to use vehicle controls.</Text>}{!!error&&<Text accessibilityRole="alert" style={{color:p.muted,fontSize:12}}>{error}</Text>}</View>;
}
