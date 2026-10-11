import React from 'react';
import {View,Text} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useBluetoothVehicle,useBluetoothPreferences} from '../bluetooth/react';
import {batteryColor,freshReading} from '../bluetooth/telemetry';
import {metricVisible} from '../bluetooth/preferences';
import {usePalette} from './ui';
export default function VehicleBatteryBadge({vehicleId,now}:{vehicleId:string;now:number}){
 const p=usePalette(),snapshot=useBluetoothVehicle(vehicleId),{preferences}=useBluetoothPreferences();const battery=snapshot.vehicleId===vehicleId && snapshot.state==='connected' && !snapshot.simulated && metricVisible(preferences,'batteryPercent')?freshReading(snapshot.fields,'batteryPercent',now):undefined;
 if(!battery || typeof battery.value!=='number')return null;
 const percent=battery.value,color=batteryColor(percent)||p.text,charging=metricVisible(preferences,'charging') && freshReading(snapshot.fields,'charging',now)?.value===true;
 return <View accessibilityLabel={`Vehicle battery ${Math.round(percent)} percent${charging?' · charging':''}`} style={{flexDirection:'row',gap:5,alignItems:'center',backgroundColor:p.card,borderRadius:9,padding:6}}><View style={{width:22,height:12,borderWidth:1.5,borderColor:color,borderRadius:3,padding:1}}><View style={{backgroundColor:color,width:`${percent}%`,height:'100%',borderRadius:1}} /></View>{charging && <Ionicons name="flash" size={11} color={color} />}<Text style={{color,fontSize:11,fontWeight:'700'}}>{Math.round(percent)}%</Text></View>;
}
