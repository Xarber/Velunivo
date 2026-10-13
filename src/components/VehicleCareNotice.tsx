import React,{useEffect,useState} from 'react';
import {Pressable,View} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useStore} from '../services/store';
import {recordedRides,subscribeRides} from '../services/rideHistory';
import {maintenanceStatus,vehicleRecordedMeters} from '../core/maintenance';
import Text from './LocalizedText';
import {usePalette} from './ui';
import {t} from '../i18n/core';
export default function VehicleCareNotice({vehicleId}:{vehicleId:string}){const p=usePalette(),{vehicles}=useStore(),[meters,setMeters]=useState(0);useEffect(()=>{let live=true;const refresh=()=>void recordedRides().then(r=>{if(live)setMeters(vehicleRecordedMeters(r,vehicleId));}).catch(()=>{});refresh();const remove=subscribeRides(refresh);return()=>{live=false;remove();};},[vehicleId]);const due=(vehicles.find(v=>v.id===vehicleId)?.maintenance||[]).filter(r=>maintenanceStatus(r,meters).due);if(!due.length||vehicleId==='sharing-scooter')return null;return <Pressable accessibilityRole="button" accessibilityLabel={t('Maintenance due')} onPress={()=>router.push(`/scooter/${vehicleId}/maintenance`)} style={{padding:12,borderRadius:16,backgroundColor:p.card,flexDirection:'row',gap:10,alignItems:'center'}}><Ionicons name="construct-outline" size={23} color="#E49235"/><View style={{flex:1,gap:4}}><Text style={{color:p.text,fontWeight:'700'}}>Maintenance due</Text><Text translate={false} numberOfLines={1} style={{color:p.muted,fontSize:12}}>{due.map(r=>r.title).join(' · ')}</Text></View><Ionicons name="chevron-forward" size={18} color={p.muted}/></Pressable>}
