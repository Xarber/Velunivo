import React from 'react';
import {View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useGroupRide} from '../groups/GroupProvider';
import {useGroupClock} from '../groups/useGroupClock';
import {activeRegroup} from '../groups/regroup';
import Text from './LocalizedText';
import {IconButton} from './ui';
import {t} from '../i18n/core';
export default function RegroupWarning(){const g=useGroupRide(),now=useGroupClock(),request=activeRegroup(g.snapshot?.regroup,now);if(!request||!g.snapshot?.members.some(m=>m.id===request.by))return null;const name=g.snapshot?.members.find(m=>m.id===request.by)?.name;return <View accessibilityRole="alert" style={{backgroundColor:'#A92634',borderRadius:18,padding:12,flexDirection:'row',gap:10,alignItems:'center'}}><Ionicons name="people-outline" color="#FFFFFF" size={24}/><View style={{flex:1}}><Text style={{color:'#FFFFFF',fontWeight:'800'}}>Regroup requested</Text>{name&&<Text translate={false} numberOfLines={1} style={{color:'#FFFFFF'}}>{name}</Text>}<Text style={{color:'#FFFFFF',fontSize:12}}>Stop safely and wait for your group.</Text></View>{(request.by===g.selfId||g.snapshot?.leader===g.selfId)&&<IconButton label={t('Group is together')} icon="checkmark-outline" onPress={()=>g.requestRegroup(false)}/>}</View>;}
