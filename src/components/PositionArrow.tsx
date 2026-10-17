import {useDisplayCosmetics} from '../services/rewardTesting';
import {useStore} from '../services/store';
import {t} from '../i18n/core';
import React from 'react';
import { Animated,View,Image } from 'react-native';
const arrows={classic:require('../../assets/navigation/classic.png'),chevron:require('../../assets/navigation/chevron.png'),compass:require('../../assets/navigation/compass.png')};
export default function PositionArrow({ navigating, rotation = 0,onReady }: { navigating: boolean; rotation?: number|Animated.Value;onReady?():void }) {
  const {navigationOptions:saved}=useStore(),n=useDisplayCosmetics(saved);
  return <Animated.View accessibilityLabel={t(navigating ? 'Navigation position arrow' : 'Current position')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: typeof rotation==='number'?`${rotation}deg`:rotation.interpolate({inputRange:[-3600,3600],outputRange:['-3600deg','3600deg']}) }] }}>{navigating ? <Image key={n.navigationArrow} source={arrows[n.navigationArrow]??arrows.classic} resizeMode="contain" onLoad={onReady} fadeDuration={0} style={{width:44,height:44}}/> : <View style={{ width: 22, height: 22, borderRadius: n.locationPin==='diamond'?5:11, backgroundColor: '#287CF5', borderWidth: n.locationPin==='halo'?5:3, borderColor: 'white', boxShadow: '0 2px 6px #00000025' }} />}</Animated.View>;
}
