// SPDX-License-Identifier: AGPL-3.0-only
import React,{useEffect,useState} from 'react';
import {Modal,Platform,ScrollView,Switch,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {lockedCredentialAccessEnabled,setLockedCredentialAccess} from '../bluetooth/persistence';
import Text from './LocalizedText';
import {Button,usePalette} from './ui';
import {t} from '../i18n/core';
export default function LockedCredentialSettings(){
 const p=usePalette(),[enabled,setEnabled]=useState(false),[confirm,setConfirm]=useState(false),[remaining,setRemaining]=useState(3),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{void lockedCredentialAccessEnabled().then(setEnabled).catch(()=>setError('Could not update credential protection. Unlock your phone and try again.'));},[]);
 useEffect(()=>{if(!confirm)return;const start=Date.now();const timer=setInterval(()=>setRemaining(Math.max(0,3-Math.floor((Date.now()-start)/1000))),100);return()=>clearInterval(timer);},[confirm]);
 const enableLabel=remaining?t('Enable in {seconds}s').replace('{seconds}',String(remaining)):t('Enable reduced protection');
 if(Platform.OS!=='ios')return null;
 async function change(value:boolean){setBusy(true);setError('');try{await setLockedCredentialAccess(value);setEnabled(value);setConfirm(false);}catch{setError('Could not update credential protection. Unlock your phone and try again.');}finally{setBusy(false);}}
 return <View style={{gap:8}}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><Ionicons name="warning" size={22} color="#D75451"/><Text style={{flex:1,color:p.text}}>Allow scooter credentials while locked</Text><Switch accessibilityLabel={t('Allow scooter credentials while locked')} disabled={busy} value={enabled} onValueChange={value=>{if(value){setRemaining(3);setConfirm(true);}else void change(false);}}/></View>{enabled&&<Text style={{color:'#D75451',fontSize:12}}>Reduced protection. New file backups include scooter pairing secrets.</Text>}{!!error&&<Text style={{color:'#D75451'}}>{error}</Text>}<Modal visible={confirm} transparent animationType="fade" supportedOrientations={['portrait','landscape-left','landscape-right']} onRequestClose={()=>{if(!busy)setConfirm(false);}}><View style={{flex:1,backgroundColor:'#0009',justifyContent:'center',padding:24}}><ScrollView accessibilityViewIsModal style={{maxHeight:'90%',backgroundColor:p.card,borderRadius:22,maxWidth:520,alignSelf:'center',width:'100%'}} contentContainerStyle={{padding:24,gap:16}}><Ionicons name="warning" size={32} color="#D75451"/><Text style={{color:'#D75451',fontWeight:'700',fontSize:20}}>Reduced credential protection</Text><Text style={{color:p.text}}>Scooter secrets remain encrypted, but the app can read them while locked after the first unlock following a restart. This reduces protection if your phone is compromised. New file backups contain unencrypted pairing secrets: anyone with a backup may be able to control your scooter. Keep backups private. Disabling this does not remove secrets from existing backups. This does not guarantee iOS will wake the app.</Text><Button title={enableLabel} icon="warning-outline" disabled={remaining>0||busy} onPress={()=>void change(true)}/><Button secondary title="Cancel" disabled={busy} onPress={()=>setConfirm(false)}/></ScrollView></View></Modal></View>;
}
