import {t} from '../i18n/core';
import Text from './LocalizedText';
import React,{useEffect,useState} from 'react';
import {Modal, View} from 'react-native';
import {subscribeRideNotices, RideNotice} from '../services/rideNotice';
import {Button,styles,usePalette} from './ui';
export default function ShortRideNotice(){const p=usePalette(),[notice,setNotice]=useState<RideNotice|null>(null);useEffect(()=>subscribeRideNotices(setNotice),[]);const dismiss=()=>{setNotice(null);notice?.confirm?.();};return <Modal visible={!!notice} transparent animationType="fade" onRequestClose={dismiss}><View style={{flex:1,justifyContent:'center',backgroundColor:'#0007',padding:24}}><View style={[styles.card,{backgroundColor:p.card,maxWidth:420,width:'100%',alignSelf:'center'}]}><Text style={{color:p.text,fontSize:18,fontWeight:'700'}}>{notice?.title}</Text><Text style={{color:p.muted,lineHeight:22}}>{notice?.message}</Text><Button title={t("OK")} icon="checkmark" onPress={dismiss} /></View></View></Modal>;}
