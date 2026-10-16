import {useStore} from '../../../../services/store';
import {goBack} from '../../../../services/navigation';
import React from 'react';
import {ScrollView,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router,useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import Text from '../../../../components/LocalizedText';
import {Button,IconButton,styles,usePalette} from '../../../../components/ui';
import {releaseDetails} from '../../../../core/appIntroduction';
import {t} from '../../../../i18n/core';
export default function FullChangelog(){const {navigationOptions:n}=useStore(),p=usePalette(),{version}=useLocalSearchParams<{version:string}>(),release=releaseDetails.find(r=>r.version===version);return <SafeAreaView style={{flex:1,backgroundColor:p.bg}}><ScrollView contentContainerStyle={{padding:24,gap:20,maxWidth:700,width:'100%',alignSelf:'center'}}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><IconButton label={t('Back')} icon="chevron-back" onPress={()=>goBack('/settings')}/><Text style={[styles.title,{color:p.text,flex:1}]}>Full changelog</Text></View><Text translate={false} style={{color:p.muted}}>Velunivo {version}</Text>{release?.items.map(item=><View key={item.title} style={[styles.card,{backgroundColor:p.card,flexDirection:'row',gap:14}]}><Ionicons name={item.icon} size={25} color={p.accent}/><View style={{flex:1,gap:6}}><Text style={{color:p.text,fontWeight:'700'}}>{item.title}</Text><Text style={{color:p.muted,lineHeight:22}}>{item.text}</Text></View></View>)}{n.developerMode&&<Button title={t('Developer release notes')} icon="code-slash-outline" secondary onPress={()=>router.push({pathname:'/settings/changelog/developer/[version]',params:{version}})}/>}</ScrollView></SafeAreaView>}
