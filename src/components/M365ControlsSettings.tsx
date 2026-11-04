import React,{useEffect,useState} from 'react';
import {View,ScrollView,Switch} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useBluetoothVehicle} from '../bluetooth/react';
import {bluetoothBridge} from '../bluetooth/service';
import {defaultM365RideControls} from '../bluetooth/plugins/m365ControlPolicy';
import {loadM365RideControls,saveM365RideControls} from '../bluetooth/plugins/m365RideControls';
import Text from './LocalizedText';
import {usePalette,IconButton,styles} from './ui';
import {goBack} from '../services/navigation';
import {t} from '../i18n/core';
export default function M365ControlsSettings({id}:{id:string}){
 const p=usePalette(),s=useBluetoothVehicle(id),[value,setValue]=useState(defaultM365RideControls),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let cancelled=false;void loadM365RideControls(id).then(v=>{if(!cancelled){setValue(v);setLoaded(true);}}).catch(()=>setError('Could not read scooter controls.'));return()=>{cancelled=true;};},[id]);
 const supported=(s.vehicleId===id?s.pluginId:bluetoothBridge.association(id)?.pluginId)==='xiaomi-m365-v1';
 const update=(key:'unlockOnStart'|'lockOnFinish',enabled:boolean)=>{const next={...value,[key]:enabled};setValue(next);void saveM365RideControls(id,next).catch(()=>setError('Could not save scooter controls.'));};
 return <SafeAreaView style={{flex:1,backgroundColor:p.bg}}><ScrollView contentContainerStyle={{padding:24,gap:20,maxWidth:700,width:'100%',alignSelf:'center'}}><View style={{flexDirection:'row',gap:12,alignItems:'center'}}><IconButton icon="chevron-back" label={t('Back to vehicle')} onPress={()=>goBack(`/scooter/${id}`)}/><Text style={[styles.title,{color:p.text}]}>Scooter controls</Text></View>{supported?<View style={[styles.card,{backgroundColor:p.card,gap:16}]}>{([['unlockOnStart','Unlock when starting a ride'],['lockOnFinish','Lock when ending a ride']] as const).map(([key,label])=><View key={key} style={{flexDirection:'row',alignItems:'center',gap:12}}><Text style={{flex:1,color:p.text}}>{label}</Text><Switch accessibilityLabel={t(label)} disabled={!loaded} value={value[key]} onValueChange={enabled=>update(key,enabled)} trackColor={{true:p.accent}}/></View>)}<Text style={{color:p.muted,fontSize:12}}>Only while connected and stationary. Failed or unsafe actions are skipped, never queued for later.</Text></View>:<Text style={{color:p.muted}}>Scooter controls are unavailable for this vehicle.</Text>}<View style={[styles.card,{backgroundColor:p.card,gap:10}]}><Text style={{color:p.text,fontWeight:'700'}}>SHFW system settings</Text><Text style={{color:'#E49235'}}>Unavailable: no verified firmware-specific protocol for sleep and locked timeouts. No setting will be written.</Text></View><View style={[styles.card,{backgroundColor:p.card,gap:10}]}><Text style={{color:p.text,fontWeight:'700'}}>Headlight</Text><Text style={{color:'#E49235'}}>Headlight control and automatic night lighting are unavailable on this protocol. Unsupported buttons are hidden.</Text></View>{!!error&&<Text style={{color:p.muted}}>{error}</Text>}</ScrollView></SafeAreaView>;
}
