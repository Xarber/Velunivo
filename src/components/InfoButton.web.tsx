import React,{useState,useRef,useEffect} from 'react';
import {createPortal} from 'react-dom';
import {View,Pressable,ScrollView,useWindowDimensions} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import Text from './LocalizedText';import {t} from '../i18n/core';import {IconButton,styles,usePalette} from './ui';
/** A body-level portal avoids clipping and stacking contexts inside scrollable cards. */
export default function InfoButton({title='More information',children}:{title?:string;children:React.ReactNode}){
 const p=usePalette(),{width,height}=useWindowDimensions(),[anchor,setAnchor]=useState<{x:number;y:number;width:number;height:number}|null>(null);
 const button=useRef<View>(null),hover=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),close=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),overPopover=useRef(false);
 const clearHover=()=>{clearTimeout(hover.current);hover.current=undefined;};
 const clearClose=()=>{clearTimeout(close.current);close.current=undefined;};
 const open=()=>button.current?.measureInWindow((x,y,w,h)=>setAnchor({x,y,width:w,height:h}));
 const leave=()=>{clearHover();close.current=setTimeout(()=>{if(!overPopover.current)setAnchor(null);},100);};
 useEffect(()=>()=>{clearTimeout(hover.current);clearTimeout(close.current);},[]);
 useEffect(()=>{if(!anchor){overPopover.current=false;return;}const dismiss=()=>setAnchor(null);window.addEventListener('resize',dismiss);window.addEventListener('scroll',dismiss,true);return()=>{window.removeEventListener('resize',dismiss);window.removeEventListener('scroll',dismiss,true);};},[anchor]);
 const popupWidth=Math.min(440,width-48),below=anchor?height-anchor.y-anchor.height>=320:true;
 return <View ref={button} style={{alignSelf:'flex-start'}}><Pressable accessibilityRole="button" accessibilityLabel={t(`About ${title}`)} onPress={()=>{clearHover();clearClose();if(anchor)setAnchor(null);else open();}} onHoverIn={()=>{clearClose();clearHover();hover.current=setTimeout(open,1000);}} onHoverOut={leave} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Ionicons name="information-circle-outline" size={22} color={p.muted}/></Pressable>{anchor&&typeof document!=='undefined'&&createPortal(<div onPointerEnter={()=>{overPopover.current=true;clearClose();}} onPointerLeave={()=>{overPopover.current=false;setAnchor(null);}} style={{position:'fixed',zIndex:100000,left:Math.max(24,Math.min(width-popupWidth-24,anchor.x+anchor.width-popupWidth)),...(below?{top:anchor.y+anchor.height}:{bottom:height-anchor.y}),width:popupWidth}}><View style={[styles.card,{backgroundColor:p.card,width:'100%',boxShadow:'0 8px 28px #0005'}]}><View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Text style={{flex:1,color:p.text,fontWeight:'700',fontSize:19}}>{title}</Text><IconButton label={t('Close information')} icon="close" onPress={()=>setAnchor(null)}/></View><ScrollView style={{flexGrow:0,maxHeight:height*.55}} contentContainerStyle={{gap:12}}>{typeof children==='string'?<Text style={{color:p.muted,lineHeight:23}}>{children}</Text>:children}</ScrollView></View></div>,document.body)}</View>;
}
