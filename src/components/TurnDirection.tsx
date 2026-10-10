import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { maneuverDistance } from '../core/rideView';
import { usePalette } from './ui';
export function turnIcon(sign: number) { return sign === 4 ? 'flag' : sign === -8 || sign === 8 ? 'return-down-back' : sign < 0 ? 'arrow-back' : sign > 0 ? 'arrow-forward' : 'arrow-up'; }
export default function TurnDirection({text,sign=0,meters,unit,status,arrived=false}: {text:string;sign?:number;meters?:number;unit:'km'|'mi';status?:string;arrived?:boolean}) { const p=usePalette(); return <View style={{flexDirection:'row',gap:14,alignItems:'center',padding:14}}><Ionicons name={turnIcon(sign)} color={p.accent} size={38} /><View style={{flex:1}}><Text style={{color:p.accent,fontWeight:'800',fontSize:24}}>{arrived ? 'Arrived' : meters === undefined ? 'Follow the route' : maneuverDistance(meters,unit)}</Text><Text numberOfLines={3} style={{color:p.text,fontSize:17,fontWeight:'600'}}>{text}</Text>{!!status && <Text numberOfLines={1} style={{color:p.muted,fontSize:10,marginTop:5}}>{status}</Text>}</View></View>; }
