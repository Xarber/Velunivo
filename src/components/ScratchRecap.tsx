import React,{useState} from 'react';
import {Modal,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {scratchMap,useScratchIndex} from '../services/scratchMap';
import {useStore} from '../services/store';
import {Button,IconButton,usePalette} from './ui';
import {t,countText} from '../i18n/core';
import ScratchViewer from './ScratchViewer';
export default function ScratchRecap(){const data=useScratchIndex(),{vehicleLocked}=useStore(),insets=useSafeAreaInsets(),p=usePalette(),[view,setView]=useState(false);if(!data.recap)return null;const close=()=>{setView(false);scratchMap.dismissRecap();};return <><View style={{position:'absolute',zIndex:2000,top:insets.top+12,right:16,left:16,maxWidth:480,alignSelf:'center',backgroundColor:p.card,borderRadius:20,padding:10,flexDirection:'row',gap:10,display:vehicleLocked?'none':'flex'}}><View style={{flex:1}}><Button title={countText('{count} new tiles',data.recap.cells.length)} icon="grid-outline" secondary onPress={()=>setView(true)}/></View><IconButton label={t('Dismiss')} icon="close" onPress={close}/></View><Modal supportedOrientations={['portrait','portrait-upside-down','landscape-left','landscape-right']} visible={view&&!vehicleLocked} animationType="fade" onRequestClose={close}><ScratchViewer highlight={data.recap.cells} close={close}/></Modal></>}
