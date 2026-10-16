import React from 'react';
import {View} from 'react-native';
import {useGroupRide} from '../groups/GroupProvider';
import {usePalette,IconButton} from './ui';
import Text from './LocalizedText';
import {t} from '../i18n/core';
export default function JoinRequestBanner(){const group=useGroupRide(),p=usePalette(),request=group.snapshot?.leader===group.selfId?group.snapshot.requests?.[0]:undefined;if(!request)return null;return <View accessibilityRole="alert" style={{backgroundColor:p.card,borderRadius:14,padding:10,flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1}}><Text style={{color:p.accent,fontWeight:'700'}}>Join request</Text><Text translate={false} style={{color:p.text}} numberOfLines={1}>{request.name}</Text></View><IconButton label={t('Accept')} icon="checkmark" onPress={()=>group.approve(request.id,true)}/><IconButton label={t('Decline')} icon="close" onPress={()=>group.approve(request.id,false)}/></View>;}
