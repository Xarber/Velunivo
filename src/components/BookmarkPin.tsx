import {View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {usePalette} from './ui';
export default function BookmarkPin(){const p=usePalette();return <View style={{width:28,height:32,alignItems:'center',justifyContent:'center',backgroundColor:p.accent,borderColor:'#FFFFFF',borderWidth:2,borderRadius:10}}><Ionicons name="bookmark" color="#FFFFFF" size={17}/></View>;}
