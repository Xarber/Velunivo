import React,{useState,useEffect} from 'react';
import {Text,View} from 'react-native';
import {useBluetoothVehicle,useBluetoothPreferences} from '../bluetooth/react';
import {freshReading,metricLabels} from '../bluetooth/telemetry';
import {metricVisible} from '../bluetooth/preferences';
import {distanceLeft,displaySpeed} from '../core/rideView';
import {useStore} from '../services/store';
import {usePalette} from './ui';
export default function VehicleTelemetryPanel({vehicleId}:{vehicleId:string}){
 const [now,setNow]=useState(()=>Date.now());useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const snapshot=useBluetoothVehicle(vehicleId),{preferences}=useBluetoothPreferences(),{navigationOptions:n}=useStore(),p=usePalette();
 if(snapshot.vehicleId!==vehicleId)return null;
 return <View style={{gap:8}}>{snapshot.simulated && <Text style={{color:'#E49235',fontWeight:'800'}}>SIMULATED telemetry · developer test</Text>}{snapshot.capabilities?.fields.filter(key=>metricVisible(preferences,key)).map(key=>{const r=snapshot.state==='connected'?freshReading(snapshot.fields,key,now,false):undefined;let value='Unavailable';if(r){value=typeof r.value==='number'?(key==='speed'?`${displaySpeed(r.value*3.6,n.unit).toFixed(1)} ${n.unit==='mi'?'mph':'km/h'}`:r.unit==='m'?distanceLeft(r.value,n.unit):`${r.value.toFixed(key==='batteryPercent'?0:1)} ${r.unit}`):key==='charging'?(r.value?'Charging':'Not charging'):String(r.value);}
 return <View key={key} style={{flexDirection:'row',justifyContent:'space-between',gap:12}}><Text style={{color:p.muted}}>{metricLabels[key]}</Text><Text style={{color:p.text}}>{value}{r?.source==='calculated'?' · calculated':''}</Text></View>;})}</View>;
}
