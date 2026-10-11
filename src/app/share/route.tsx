import {t} from '../../i18n/core';
import Text from '../../components/LocalizedText';
import React,{useMemo} from 'react';
import {View, Platform, Linking} from 'react-native';
import {useLocalSearchParams,router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import RideMap from '../../components/RideMap';
import {Button,usePalette,styles} from '../../components/ui';
import {readRouteLink} from '../../sharing/model';
import {useStore} from '../../services/store';
export default function SharedRoute(){
 const params=useLocalSearchParams(),p=usePalette(),{requestJourney,vehicleLocked}=useStore();
 const journey=useMemo(()=>readRouteLink(params),[params]);
 return <SafeAreaView style={{flex:1,backgroundColor:p.bg}}>{journey&&<View style={{flex:1}}><RideMap routes={[]} selected={null} startPoint={journey.start} endPoint={journey.end} fitPadding={{top:30,left:40,right:40,bottom:40}} /></View>}<View style={[styles.card,{backgroundColor:p.card}]}><Text style={{color:p.text,fontSize:24,fontWeight:'800'}}>Shared route</Text><Text style={{color:p.muted}}>{journey?`${journey.startLabel} → ${journey.endLabel}`:'This route link has invalid endpoints.'}</Text>{journey&&<><Text style={{color:p.muted}}>Plan bicycle and car-road alternatives with your own vehicle. Your ride starts only when you choose Start ride.</Text><Button title={t(vehicleLocked?'Finish your active ride first':'Plan on this device')} icon="navigate-outline" disabled={vehicleLocked} onPress={()=>{requestJourney({...journey,requestedAt:Date.now()});router.replace('/');}} />{Platform.OS==='web'&&<Button title={t("Open in Velunivo app")} icon="phone-portrait-outline" secondary onPress={()=>void Linking.openURL(`velunivo://share/route?${new URLSearchParams({start:journey.start.join(','),end:journey.end.join(','),from:journey.startLabel,to:journey.endLabel,...(journey.stops?{stops:JSON.stringify(journey.stops)}:{})})}`)} />}</>}<Button title={t("Back to Explore")} secondary onPress={()=>router.replace('/')} /></View></SafeAreaView>;
}
