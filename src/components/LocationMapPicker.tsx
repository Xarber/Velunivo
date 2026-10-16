import React,{useRef,useEffect,useState,useMemo} from 'react';
import {View,ActivityIndicator} from 'react-native';
import {useLocation} from '../services/useLocation';
import {Coord} from '../core/types';
import RideMap from './RideMap';
import {usePalette} from './ui';
import Text from './LocalizedText';
/** Shared by all dedicated pickers. The first fresh location frames the map;
 * subsequent fixes update the marker, never interrupt a user's map gesture. */
export default function LocationMapPicker(props:Omit<React.ComponentProps<typeof RideMap>,'position'|'mapBounds'|'startPoint'|'follow'>){
 const location=useLocation(true),p=usePalette(),moved=useRef(false),centered=useRef(false),[center,setCenter]=useState<Coord>();
 useEffect(()=>{if(!location.fix||moved.current||centered.current)return;centered.current=true;const point=location.fix.coordinate;const timer=setTimeout(()=>setCenter(point),0);return()=>clearTimeout(timer);},[location.fix]);
 const bounds=useMemo<[number,number,number,number]|undefined>(()=>center?[center[0]-.006,center[1]-.004,center[0]+.006,center[1]+.004]:undefined,[center]);
 return <View style={{flex:1}}><RideMap {...props} position={location.fix?.coordinate} mapBounds={bounds} follow={false} onPan={()=>{moved.current=true;props.onPan?.();}}/>{!location.fix&&<View pointerEvents="none" style={{position:'absolute',bottom:16,left:16,right:16,backgroundColor:p.card,padding:12,borderRadius:14,flexDirection:'row',gap:8,alignItems:'center'}}><ActivityIndicator size="small" color={p.accent}/><Text style={{color:p.muted,flex:1,fontSize:12}}>{location.status}</Text></View>}</View>;
}
