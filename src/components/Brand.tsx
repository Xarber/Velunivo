import {t} from '../i18n/core';
import Text from './LocalizedText';
import React from 'react';
import {View} from 'react-native';
import Svg,{Rect,Path,Circle} from 'react-native-svg';
import {usePalette} from './ui';
/** The original logo paths with independently themed background and foreground. */
export function BrandIcon({size=32}:{size?:number}){const p=usePalette();return <Svg accessibilityLabel={t('Velunivo')} width={size} height={size} viewBox="0 0 1024 1024"><Rect width="1024" height="1024" rx="250" fill={p.accentLight}/><Path d="M296 366L476 674Q490 698 508 662L696 314" fill="none" stroke={p.accentDark} strokeWidth="82" strokeLinecap="round" strokeLinejoin="round"/><Path d="M559 314H696V452" fill="none" stroke="#FFFFFF" strokeWidth="82" strokeLinecap="round" strokeLinejoin="round"/><Circle cx="296" cy="366" r="41" fill="#FFFFFF"/></Svg>;}
export default function Brand(){const p=usePalette();return <View accessible accessibilityLabel={t('Velunivo')} style={{flexDirection:'row',alignItems:'center',gap:8}}><BrandIcon/><Text style={{color:p.text,fontSize:25,letterSpacing:-1.2,fontWeight:'800'}}>Velunivo</Text></View>;}
