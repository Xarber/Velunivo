import React,{useEffect,useMemo,useState} from 'react';
import {View,Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Fix} from '../core/types';
import {RecordedRide} from '../core/recordings';
import {frequentRides,FrequentRide} from '../core/frequentRides';
import {recordedRides,subscribeRides} from '../services/rideHistory';
import {usePalette} from './ui';
import Text from './LocalizedText';
import {t} from '../i18n/core';
export default function FrequentRides({fix,onSelect}:{fix:Fix|null;onSelect:(ride:FrequentRide)=>void}){
 const p=usePalette(),[rides,setRides]=useState<RecordedRide[]>([]),[now,setNow]=useState(Date.now);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),15000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{let live=true;const refresh=()=>void recordedRides().then(v=>{if(live)setRides(v);}).catch(()=>{});refresh();const stop=subscribeRides(refresh);return()=>{live=false;stop();};},[]);
 const suggestions=useMemo(()=>frequentRides(rides,fix,now),[rides,fix,now]);
 if(!suggestions.length)return null;
 return <View style={{gap:8}}><Text style={{color:p.text,fontWeight:'700'}}>Frequent rides</Text>{suggestions.map(r=><Pressable key={r.lastAt} accessibilityRole="button" accessibilityLabel={t('Plan a ride')+' · '+r.endLabel} onPress={()=>onSelect(r)} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10}}><Ionicons name="repeat-outline" size={22} color={p.accent}/><Text translate={false} numberOfLines={1} style={{color:p.text,flex:1}}>{r.endLabel}</Text><Ionicons name="chevron-forward" size={18} color={p.muted}/></Pressable>)}</View>;
}
