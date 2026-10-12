import React from 'react';
import {Modal,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import Text from './LocalizedText';
import {Button,usePalette} from './ui';
import {distanceLeft} from '../core/rideView';
import {t} from '../i18n/core';
export default function ArrivalScreen({visible,destination,meters,startedAt,endedAt,unit,onDone}:{visible:boolean;destination:string;meters:number;startedAt?:number;endedAt?:number;unit:'km'|'mi';onDone():void}){
 const p=usePalette();
 return <Modal visible={visible} animationType="fade" onRequestClose={onDone}><SafeAreaView style={{flex:1,backgroundColor:p.bg,justifyContent:'center',padding:28}}><View style={{width:'100%',maxWidth:480,alignSelf:'center',gap:20,alignItems:'center'}}><Ionicons name="checkmark-circle" size={76} color={p.accent}/><Text accessibilityRole="header" style={{color:p.text,fontSize:32,fontWeight:'800',textAlign:'center'}}>You have arrived</Text><Text numberOfLines={3} style={{color:p.muted,fontSize:18,textAlign:'center'}}>{destination}</Text><Text style={{color:p.text,fontSize:20,fontWeight:'700'}}>{distanceLeft(meters,unit)}{startedAt&&endedAt?` · ${Math.max(1,Math.round((endedAt-startedAt)/60000))} ${t('min')}`:''}</Text><Text style={{color:p.muted,textAlign:'center'}}>Navigation and recording have stopped.</Text><View style={{width:'100%',marginTop:12}}><Button title={t('Done')} icon="checkmark" onPress={onDone}/></View></View></SafeAreaView></Modal>;
}
