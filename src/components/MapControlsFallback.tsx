import {t} from '../i18n/core';
import Text from './LocalizedText';
import React from 'react';
import {Platform, View} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassSurface from './GlassSurface';
import PressMotion from './PressMotion';
import { usePalette } from './ui';
export default function MapControlsFallback({top,right=12,follow,compass,tilted,resume,toggleCompass,toggleTilt,overview=false,onOverview,onSearch,onSettings}:{top:number;right?:number;follow:boolean;compass:boolean;tilted:boolean;resume():void;toggleCompass():void;toggleTilt():void;overview?:boolean;onOverview?():void;onSearch?():void;onSettings?():void}) {
 const p=usePalette(),control={width:44,height:44,alignItems:'center' as const,justifyContent:'center' as const};
 return <GlassSurface interactive style={{position:'absolute',right,top,borderRadius:23,padding:3,gap:2,width:50,alignItems:'center',boxShadow:'0 3px 16px #00000020'}}>
  {onSearch&&<><PressMotion accessibilityRole="button" accessibilityLabel={t('Plan a ride')} onPress={onSearch} style={control}><Ionicons name="search" size={24} color={p.accent}/></PressMotion><View style={{height:1,width:26,backgroundColor:p.line}}/></>}
  {onSettings&&<><PressMotion accessibilityRole="button" accessibilityLabel={t('Settings')} onPress={onSettings} style={control}><Ionicons name="settings-outline" size={24} color={p.accent}/></PressMotion><View style={{height:1,width:26,backgroundColor:p.line}}/></>}
  <PressMotion accessibilityRole="button" accessibilityLabel={t(overview?'Return to navigation':!follow?'Follow current location':Platform.OS==='web'?'Follow travel direction':compass?'Use travel direction':'Use device compass')} accessibilityState={{selected:compass && follow}} onPress={()=>{if(!follow || overview)resume();else if(Platform.OS!=='web')toggleCompass();}} style={control}><Ionicons name={compass && Platform.OS!=='web'?'compass-outline':'navigate'} size={25} color="#287CF5" style={compass && Platform.OS!=='web'?undefined:{transform:[{rotate:'-45deg'}]}} /></PressMotion>
  <View style={{height:1,width:26,backgroundColor:p.line}} />
  <PressMotion accessibilityRole="button" accessibilityLabel={t(tilted?'Use flat map':'Use 3D tilted map')} accessibilityState={{selected:tilted}} onPress={toggleTilt} style={control}><Text style={{color:'#287CF5',fontSize:17,fontWeight:'800'}}>{tilted?'2D':'3D'}</Text></PressMotion>
  {onOverview && <><View style={{height:1,width:26,backgroundColor:p.line}} /><PressMotion accessibilityRole="button" accessibilityLabel={t(overview?'Return to navigation':'Show full route')} onPress={overview?resume:onOverview} style={control}><Ionicons name={overview?'navigate-outline':'expand-outline'} size={23} color="#287CF5" /></PressMotion></>}
 </GlassSurface>;
}
