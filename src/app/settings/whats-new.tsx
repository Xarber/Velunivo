import React from 'react';
import {ScrollView,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import Text from '../../components/LocalizedText';
import {IconButton,styles,usePalette} from '../../components/ui';
import {releaseHighlights} from '../../core/appIntroduction';
import {t} from '../../i18n/core';
export default function WhatsNew(){const p=usePalette();return <SafeAreaView style={{flex:1,backgroundColor:p.bg}}><ScrollView contentContainerStyle={{padding:24,gap:22,maxWidth:700,width:'100%',alignSelf:'center'}}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><IconButton label={t('Back to Settings')} icon="chevron-back" onPress={()=>router.back()}/><Text style={[styles.title,{color:p.text}]}>What’s new</Text></View><Text style={{color:p.muted}}>Release and development build history.</Text>{releaseHighlights.map(release=><View key={release.version} style={[styles.card,{backgroundColor:p.card}]}><Text style={{color:p.muted,fontWeight:'700'}}>Velunivo {release.version}</Text>{release.items.map(item=><View key={item.title} style={{flexDirection:'row',gap:14,paddingVertical:4}}><Ionicons name={item.icon} size={28} color={p.accent}/><View style={{flex:1,gap:4}}><Text style={{color:p.text,fontWeight:'700',fontSize:17}}>{item.title}</Text><Text style={{color:p.muted,lineHeight:22}}>{item.text}</Text></View></View>)}</View>)}</ScrollView></SafeAreaView>}
