import Svg,{Path} from 'react-native-svg';
import {useStore} from '../services/store';
import {arrowPath} from '../core/cosmeticRewards';
import {t} from '../i18n/core';
import React from 'react';
import { Animated,View } from 'react-native';
export default function PositionArrow({ navigating, rotation = 0 }: { navigating: boolean; rotation?: number|Animated.Value }) {
  const {navigationOptions:n}=useStore();
  return <Animated.View accessibilityLabel={t(navigating ? 'Navigation position arrow' : 'Current position')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: typeof rotation==='number'?`${rotation}deg`:rotation.interpolate({inputRange:[-3600,3600],outputRange:['-3600deg','3600deg']}) }] }}>{navigating ? <Svg width={40} height={44} viewBox="0 0 40 42"><Path d={arrowPath(n.navigationArrow)} fill="#287CF5" stroke="white" strokeWidth="3" strokeLinejoin="round"/></Svg> : <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#287CF5', borderWidth: 3, borderColor: 'white', boxShadow: '0 2px 6px #00000025' }} />}</Animated.View>;
}
