import React from 'react';import {Pressable,View,useWindowDimensions} from 'react-native';
import {useGroupRide} from '../groups/GroupProvider';import GroupVideoPin from './GroupVideoPin';import Text from './LocalizedText';import {usePalette} from './ui';import {t} from '../i18n/core';
/** A second view of the existing stream: never creates a camera or peer connection. */
export default function GroupCameraPreview({active,bottom=16,right=12}:{active:boolean;bottom?:number;right?:number}){const group=useGroupRide(),p=usePalette(),{width:screen}=useWindowDimensions();const rider=group.snapshot?.members.find(m=>m.id===group.pinnedVideo),feed=group.pinnedVideo?group.videoFeeds[group.pinnedVideo]:undefined;
 if(!active||!group.videoEnabled||!rider?.camera||!feed)return null;
 const width=screen>=800?180:136,height=width*.75;
 return <Pressable accessibilityRole="button" accessibilityLabel={t('Close camera preview')} onPress={()=>group.pinVideo(null)} style={{position:'absolute',bottom,right,width,height,borderRadius:16,overflow:'hidden',borderWidth:2,borderColor:p.accent,backgroundColor:'#071118',zIndex:20}}><View pointerEvents="none"><GroupVideoPin feed={feed} width={width} height={height}/><View style={{position:'absolute',bottom:0,left:0,right:0,paddingHorizontal:8,paddingVertical:5,backgroundColor:'#0008'}}><Text translate={false} numberOfLines={1} style={{color:'white',fontSize:11,fontWeight:'600'}}>{rider.name}</Text></View></View></Pressable>;
}
