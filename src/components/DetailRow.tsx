import React from 'react';
import {View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {usePalette} from './ui';
/** A quiet visual anchor for information-heavy cards. Text remains fully accessible. */
export default function DetailRow({icon,children,heading=false}:{icon:React.ComponentProps<typeof Ionicons>['name'];children:React.ReactNode;heading?:boolean}){
 const p=usePalette();
 return <View style={{flexDirection:'row',alignItems:'flex-start',gap:10}}><View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{width:heading?25:20,paddingTop:heading?2:1,alignItems:'center'}}><Ionicons name={icon} color={heading?p.accent:p.muted} size={heading?23:18}/></View><View style={{flex:1,minWidth:0}}>{children}</View></View>;
}
