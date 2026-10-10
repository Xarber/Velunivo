import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, styles, usePalette } from '../../components/ui';
export default function Library() { const p=usePalette(); return <SafeAreaView style={{flex:1,backgroundColor:p.bg}}><ScrollView contentContainerStyle={{padding:24,gap:18,maxWidth:700,width:'100%',alignSelf:'center'}}><Text style={[styles.title,{color:p.text}]}>Library</Text><Text style={{color:p.muted}}>Places, routes and memories of your rides.</Text>{([{key:'places',title:'Saved Places',icon:'location-outline'},{key:'routes',title:'Saved Routes',icon:'bookmark-outline'},{key:'rides',title:'Recorded Rides',icon:'bicycle-outline'},{key:'maps',title:'Downloaded Maps',icon:'download-outline'}] as const).map(x=><View key={x.key} style={[styles.card,{backgroundColor:p.card}]}><Button title={x.title} icon={x.icon} secondary onPress={()=>router.push(`/offline/${x.key}`)} /></View>)}</ScrollView></SafeAreaView>; }
