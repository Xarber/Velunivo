import React,{useState,useRef,useEffect} from 'react';
import {View} from 'react-native';
import {Fix,Coord} from '../core/types';
import {useStore} from '../services/store';
import {freshFix} from '../core/rideView';
import {Button,usePalette} from './ui';
import Text from './LocalizedText';
import {t} from '../i18n/core';
export default function RideBookmarkButton({fix,onBookmark}:{fix:Fix|null;onBookmark?(coordinate:Coord,name:string):void}){const {addPlace}=useStore(),p=usePalette(),[saved,setSaved]=useState(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);useEffect(()=>()=>clearTimeout(timer.current),[]);return <View style={{gap:4}}><Button title={t(saved?'Bookmarked':'Bookmark this spot')} icon={saved?'checkmark-outline':'bookmark-outline'} secondary disabled={!freshFix(fix)||saved} onPress={()=>{if(!fix)return;const name=`${t('Ride bookmark')} · ${new Date(fix.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;addPlace({name,address:fix.coordinate.map(v=>v.toFixed(5)).join(', '),coordinate:fix.coordinate});onBookmark?.(fix.coordinate,name);setSaved(true);timer.current=setTimeout(()=>setSaved(false),2500);}}/>{saved&&<Text style={{color:p.muted,fontSize:12}}>Saved privately in Saved Places.</Text>}</View>;}
