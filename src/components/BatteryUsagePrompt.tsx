import React, { useEffect, useState, useRef } from 'react';
import { AppState, Modal, View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recordedRides, subscribeRides, saveBatteryUsage } from '../services/rideHistory';
import { pendingBatteryRide, validBatteryUsage } from '../core/batteryLearning';
import { RecordedRide } from '../core/recordings';
import { useStore } from '../services/store';
import { Button, Field, usePalette } from './ui';
import { distanceLeft } from '../core/rideView';
export default function BatteryUsagePrompt() {
  const p=usePalette(), insets=useSafeAreaInsets(), {ready, vehicleLocked, navigationOptions:n}=useStore();
  const [ride,setRide]=useState<RecordedRide>(), [value,setValue]=useState(''), [error,setError]=useState(''), [saving,setSaving]=useState(false), [foreground,setForeground]=useState(AppState.currentState==='active');
  const currentId=useRef<string | undefined>(undefined);
  useEffect(()=>{ if (!ready || !n.askBatteryUsage || vehicleLocked || !foreground) return;
    let cancelled=false;
    const refresh=()=>void recordedRides().then(r=>{if(!cancelled){const next=pendingBatteryRide(r);if(currentId.current!==next?.id){currentId.current=next?.id;setValue('');setError('');}setRide(next);}}).catch(()=>{});
    refresh(); const unsubscribe=subscribeRides(refresh); return()=>{cancelled=true;unsubscribe();};
  },[ready,n.askBatteryUsage,vehicleLocked,foreground]);
  useEffect(()=>{const listener=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>listener.remove();},[]);
  const percent=Number(value.trim().replace(',','.')), valid=!!value.trim() && validBatteryUsage(percent);
  async function save(percent:number|null) {if(!ride || saving)return;setSaving(true);try{await saveBatteryUsage(ride.id,percent);setRide(undefined);}catch(e){setError(e instanceof Error?e.message:'Could not save battery usage.');}finally{setSaving(false);}}
  return <Modal visible={!!ride && foreground && ready && n.askBatteryUsage && !vehicleLocked} transparent animationType="fade" onRequestClose={()=>void save(null)}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1,justifyContent:'center',backgroundColor:'#00000080',padding:20,paddingTop:insets.top+20,paddingBottom:insets.bottom+20}}><ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center'}} keyboardShouldPersistTaps="handled"><View style={{width:'100%',maxWidth:480,alignSelf:'center',backgroundColor:p.bg,borderRadius:26,padding:24,gap:16}}><Text style={{color:p.text,fontSize:24,fontWeight:'800'}}>Battery used on this ride</Text><Text style={{color:p.muted}}>{ride?.vehicle.name} · {distanceLeft(ride?.meters || 0,n.unit)}</Text><Text style={{color:p.muted,lineHeight:21}}>How many percentage points did your vehicle use? For example, from 80% to 65% is 15%. Skip if you charged during the ride or do not know.</Text><Field label="Battery used (%)" keyboardType="decimal-pad" value={value} onChangeText={setValue} placeholder="15" /><Text style={{color:p.muted,fontSize:12}}>Used to learn this vehicle’s range after three qualifying rides. Estimates still depend on hills, weather and riding style.</Text>{!!error && <Text accessibilityRole="alert" style={{color:'#D75451'}}>{error}</Text>}<Button title={saving?'Saving…':'Save battery usage'} icon="battery-half-outline" disabled={!valid || saving} onPress={()=>void save(percent)} /><Button title="Skip" icon="close" secondary disabled={saving} onPress={()=>void save(null)} /></View></ScrollView></KeyboardAvoidingView></Modal>;
}
