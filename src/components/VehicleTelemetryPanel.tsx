import {UI_REFINEMENTS} from '../core/uiRefinements';
import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import VehicleLockControls from './VehicleLockControls';
import {t} from '../i18n/core';
import Text from './LocalizedText';
import {BridgeSnapshot} from '../bluetooth/types';
import {canPairVehicle} from '../bluetooth/policy';
import React,{useState,useEffect} from 'react';
import {View} from 'react-native';
import {useBluetoothVehicle,useBluetoothPreferences} from '../bluetooth/react';
import {retainedReading,metricLabels} from '../bluetooth/telemetry';
import {metricVisible} from '../bluetooth/preferences';
import {distanceLeft,displaySpeed} from '../core/rideView';
import {useStore} from '../services/store';
import {Button,usePalette} from './ui';
export default function VehicleTelemetryPanel({vehicleId,snapshot:recorded,timestamp}:{vehicleId:string;snapshot?:BridgeSnapshot;timestamp?:number}){
 const [now,setNow]=useState(()=>Date.now());useEffect(()=>{if(recorded)return;const timer=setInterval(()=>setNow(Date.now()),5000);return()=>clearInterval(timer);},[recorded]);
 const live=useBluetoothVehicle(vehicleId),snapshot=recorded || live,{preferences}=useBluetoothPreferences(),{navigationOptions:n}=useStore(),p=usePalette();
 if(!canPairVehicle(vehicleId) || snapshot.vehicleId!==vehicleId || !snapshot.capabilities || snapshot.state==='idle')return null;
 return <View style={{gap:10}}>{!recorded&&snapshot.rePairRequired&&<><Text accessibilityRole="alert" style={{color:'#E49235'}}>Your scooter pairing has changed. Close other scooter apps and pair again to update the saved connection.</Text><Button title={t('Pair again')} icon="bluetooth-outline" secondary onPress={()=>router.push(`/scooter/${vehicleId}/bluetooth`)}/></>}{snapshot.simulated && <Text style={{color:'#E49235',fontWeight:'800'}}>SIMULATED telemetry · developer test</Text>}<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{snapshot.capabilities?.fields.filter(key=>metricVisible(preferences,key)).map(key=>{const retained=retainedReading(snapshot.fields,key,timestamp ?? now),r=retained?.reading;let value='Unavailable';if(r){value=typeof r.value==='number'?(key==='speed'?`${displaySpeed(r.value*3.6,n.unit).toFixed(1)} ${n.unit==='mi'?'mph':'km/h'}`:r.unit==='m'?distanceLeft(r.value,n.unit):`${r.value.toFixed(key==='batteryPercent'?0:1)} ${r.unit}`):key==='charging'?(r.value?'Charging':'Not charging'):key==='ridingMode'&&r.value==='Eco'&&n.pedestrianLabel?'Pedestrian':String(r.value);}
 return <View key={key} style={{flexGrow:1,flexBasis:'44%',backgroundColor:p.card,borderRadius:16,padding:12,gap:UI_REFINEMENTS?8:5,...(UI_REFINEMENTS?{borderWidth:1,borderColor:p.line}:{})}}><View style={{flexDirection:'row',alignItems:'center',gap:6}}>{UI_REFINEMENTS&&<Ionicons name={key==='batteryPercent'?'battery-half-outline':key==='speed'?'speedometer-outline':key==='ridingMode'?'bicycle-outline':key==='charging'?'flash-outline':key.toLowerCase().includes('temperature')?'thermometer-outline':'pulse-outline'} size={15} color={p.muted}/>}<Text style={{color:p.muted,...(UI_REFINEMENTS?{fontSize:12,flex:1}: {})}}>{metricLabels[key]}</Text></View><Text accessibilityLabel={t(`${value}${retained?.stale?' · Last received over a minute ago':''}`)} style={{color:retained?.stale?'#E49235':p.text,fontSize:UI_REFINEMENTS?20:18,fontWeight:'700'}}>{value}{retained?.stale?' · old':''}{r?.source==='calculated'?' · calculated':''}</Text></View>;})}</View>{snapshot.extensions.shfwProfile&&<Text style={{color:p.muted}}>SHFW · {String(snapshot.extensions.shfwProfile.value)}</Text>}{!recorded&&<VehicleLockControls vehicleId={vehicleId}/>}</View>;
}
