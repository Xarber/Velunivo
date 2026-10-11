import {t} from '../i18n/core';
import Text from './LocalizedText';
import React,{useState,useRef,useEffect} from 'react';
import {Modal,View,Pressable,Platform,ScrollView,useWindowDimensions} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {IconButton,styles,usePalette} from './ui';
/** Hover requires a deliberate one-second dwell; button + popover share one hover boundary. */
export default function InfoButton({title='More information',children}:{title?:string;children:React.ReactNode}){
 const p=usePalette(),{width,height}=useWindowDimensions(),[open,setOpen]=useState(false),hover=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const cancel=()=>{if(hover.current)clearTimeout(hover.current);hover.current=undefined;};
 useEffect(()=>()=>{if(hover.current)clearTimeout(hover.current);},[]);
 const content=<View style={[styles.card,{backgroundColor:p.card,width:Math.min(440,width-48),maxWidth:'100%',boxShadow:'0 8px 28px #0005'}]}><View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Text style={{flex:1,color:p.text,fontWeight:'700',fontSize:19}}>{title}</Text><IconButton label={t('Close information')} icon="close" onPress={()=>setOpen(false)}/></View><ScrollView style={{flexGrow:0,maxHeight:height*.55}} contentContainerStyle={{gap:12}}>{typeof children==='string'?<Text style={{color:p.muted,lineHeight:23}}>{children}</Text>:children}</ScrollView></View>;
 return <View style={{position:'relative',zIndex:open?10000:1,alignSelf:'flex-start'}} {...(Platform.OS==='web'?{onPointerLeave:()=>{cancel();setOpen(false);}}:{})}><Pressable accessibilityRole="button" accessibilityLabel={t(`About ${title}`)} onPress={()=>{cancel();setOpen(v=>!v);}} onHoverIn={Platform.OS==='web'?()=>{cancel();hover.current=setTimeout(()=>setOpen(true),1000);}:undefined} onHoverOut={cancel} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Ionicons name="information-circle-outline" size={22} color={p.muted}/></Pressable>{Platform.OS==='web'?open&&<View style={{position:'absolute',top:44,right:0,paddingTop:0,width:Math.min(440,width-48)}}>{content}</View>:<Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}><Pressable accessibilityLabel={t('Dismiss information')} onPress={()=>setOpen(false)} style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0006',padding:24}}><Pressable onPress={()=>{}}>{content}</Pressable></Pressable></Modal>}</View>;
}
