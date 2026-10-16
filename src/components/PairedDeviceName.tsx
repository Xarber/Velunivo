import React,{useState,useSyncExternalStore} from 'react';
import {View} from 'react-native';
import {DevicePair} from '../core/devicePair';
import {subscribeDevicePair,getDevicePairState,renamePairedDevice} from '../services/devicePairState';
import {Field,IconButton,usePalette} from './ui';
import Text from './LocalizedText';
import {t} from '../i18n/core';
export default function PairedDeviceName({pair,index}:{pair:DevicePair;index:number}){const p=usePalette(),state=useSyncExternalStore(subscribeDevicePair,getDevicePairState,getDevicePairState),id=pair.role==='host'?pair.guestDevice:pair.hostDevice,name=id?state.names[id]:'',[editing,setEditing]=useState(false),[draft,setDraft]=useState('');const save=()=>{void renamePairedDevice(pair,draft).then(()=>setEditing(false));};return <View style={{flexDirection:'row',alignItems:'center',gap:8}}>{editing?<View style={{flex:1}}><Field label={t('Device name')} value={draft} maxLength={40} autoFocus onChangeText={setDraft} onSubmitEditing={save}/></View>:<Text translate={false} numberOfLines={1} style={{flex:1,color:p.text,fontWeight:'700'}}>{name||`${t('Paired device')} ${index+1}`}</Text>}<IconButton label={t(editing?'Save':'Rename device')} icon={editing?'checkmark-outline':'pencil-outline'} onPress={()=>{if(editing)save();else{setDraft(name||'');setEditing(true);}}}/></View>;}
