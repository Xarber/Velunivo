import React,{useEffect,useRef,useState,useCallback} from 'react';
import {AppState,Modal,ScrollView,View} from 'react-native';
import {router,useFocusEffect} from 'expo-router';
import {requestRecordingStart} from '../services/recordingStartRequest';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Fix} from '../core/types';
import {RidingPromptDetector} from '../core/ridingPrompt';
import VehicleSelector from './VehicleSelector';import Text from './LocalizedText';
import {Button,IconButton,usePalette} from './ui';import {t} from '../i18n/core';
let offered=false;
export default function RidingPrompt({fix,enabled,onPlan}:{fix:Fix|null;enabled:boolean;onPlan():void}){const p=usePalette(),insets=useSafeAreaInsets(),[focused,setFocused]=useState(false),[open,setOpen]=useState(false),[introduced,setIntroduced]=useState(false),detector=useRef(new RidingPromptDetector());
 useFocusEffect(useCallback(()=>{setFocused(true);return()=>setFocused(false);},[]));
 useEffect(()=>{void AsyncStorage.getItem('welcome-seen-v1').then(value=>setIntroduced(value==='true'));const sub=AppState.addEventListener('change',state=>{if(state==='active'){detector.current.reset();void AsyncStorage.getItem('welcome-seen-v1').then(value=>setIntroduced(value==='true'));}});return()=>sub.remove();},[]);
 useEffect(()=>{if(!enabled||!focused){detector.current.reset();return;}if(fix&&!offered&&introduced&&AppState.currentState==='active'&&detector.current.accept(fix)){offered=true;setOpen(true);}},[fix,enabled,focused,introduced]);
 return <Modal supportedOrientations={['portrait','portrait-upside-down','landscape-left','landscape-right']} visible={open&&enabled&&focused} transparent animationType="slide" onRequestClose={()=>setOpen(false)}><View style={{flex:1,justifyContent:'flex-end',backgroundColor:'#0005',padding:20,paddingBottom:Math.max(20,insets.bottom)}}><View style={{backgroundColor:p.bg,borderRadius:26,padding:20,gap:16,maxWidth:560,width:'100%',alignSelf:'center',maxHeight:'80%'}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Text style={{color:p.text,fontSize:22,fontWeight:'800',flex:1}}>Looks like you’re riding</Text><IconButton label={t('Dismiss recording suggestion')} icon="close" onPress={()=>setOpen(false)}/></View><ScrollView style={{flexShrink:1}}><VehicleSelector outlined/></ScrollView><Button title={t('Start recording')} icon="recording-outline" onPress={()=>{setOpen(false);requestRecordingStart();router.push('/offline/record-trip');}}/><Button title={t('Plan a ride')} icon="search-outline" secondary onPress={()=>{setOpen(false);onPlan();}}/></View></View></Modal>;
}
