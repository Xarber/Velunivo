import {t} from '../i18n/core';
import React from 'react';
import {Animated,Image,View} from 'react-native';
import {useStore} from '../services/store';
import {useDisplayCosmetics} from '../services/rewardTesting';
import {navigationArrowAssets} from './navigationArrowAssets';
/** Fallback/preview artwork matches the map image paths; no rectangular arrow shadow. */
export default function PositionArrow({navigating,rotation=0,onReady}:{navigating:boolean;rotation?:number|Animated.Value;onReady?():void}){
 const n=useDisplayCosmetics(useStore().navigationOptions);
 return <Animated.View accessibilityLabel={t(navigating?'Navigation position arrow':'Current position')} style={{width:44,height:44,alignItems:'center',justifyContent:'center',transform:[{rotate:typeof rotation==='number'?`${rotation}deg`:rotation.interpolate({inputRange:[-3600,3600],outputRange:['-3600deg','3600deg']})}]}}>{navigating?<Image source={navigationArrowAssets[n.navigationArrow]} onLoad={onReady} style={{width:44,height:44}}/>:<View onLayout={onReady} style={{width:22,height:22,borderRadius:n.locationPin==='diamond'?5:11,backgroundColor:'#287CF5',borderWidth:n.locationPin==='halo'?5:3,borderColor:'white'}}/>}</Animated.View>;
}
