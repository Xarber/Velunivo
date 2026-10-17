import {useLastBattery} from '../services/lastBattery';import {recentBatteryCharge} from '../core/lastBattery';
import React,{useEffect,useState} from 'react';
import {View,ActivityIndicator} from 'react-native';
import {Route,Vehicle} from '../core/types';
import {batteryPlan,connectedPlanningCharge} from '../core/batteryPlan';
import {routePreferences} from '../core/routePreferences';
import {returnBatteryRoute} from '../services/returnBatteryRoute';
import {useStore} from '../services/store';
import {useBluetoothVehicle,useBluetoothLease} from '../bluetooth/react';
import Text from './LocalizedText';
import {usePalette} from './ui';
import {t} from '../i18n/core';
export default function BatteryPlanWarning({route,vehicle}:{route:Route;vehicle:Vehicle}){
 const {navigationOptions:n,places}=useStore(),bt=useBluetoothVehicle(vehicle.id),p=usePalette();
 const destination=route.coordinates.at(-1),place=places.find(v=>v.id===n.batteryReturnPlaceId),target=n.batteryReturnPlaceId==='@start'?route.coordinates[0]:place?.coordinate;
 const cached=recentBatteryCharge(useLastBattery(vehicle.id),n.useLastBattery,n.assumedBatteryPercent);const actual=connectedPlanningCharge(bt,vehicle.id),available=actual??cached.percent;const ready=true;useBluetoothLease(vehicle.id,n.batteryAwarePlanning&&vehicle.id!=='sharing-scooter');
 const custom=n.planReturnTrip&&!!n.batteryReturnPlaceId,key=JSON.stringify([destination,target,route.kind,vehicle.id,vehicle.maxSpeed,vehicle.ridingLimit,routePreferences(n)]);
 const [result,setResult]=useState<{key:string;route?:Route;failed?:boolean}|null>(null);
 useEffect(()=>{if(!ready||!custom||!n.batteryAwarePlanning||vehicle.id==='sharing-scooter')return;let cancelled=false;if(!destination||!target){queueMicrotask(()=>{if(!cancelled)setResult({key,failed:true});});}else void returnBatteryRoute(destination,target,route.kind,vehicle,routePreferences(n)).then(back=>{if(!cancelled)setResult({key,route:back});}).catch(()=>{if(!cancelled)setResult({key,failed:true});});return()=>{cancelled=true;};
 // The key captures endpoints, vehicle cap and global route preferences.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[ready,custom,n.batteryAwarePlanning,key]);
 const back=result?.key===key?result:undefined;
 const plan=batteryPlan(route,vehicle,available,n.batteryReservePercent,n.planReturnTrip&&(!custom||!!back?.route),back?.route);if(!ready||!n.batteryAwarePlanning||!plan)return null;
 return <View style={{gap:3}}>{custom&&!back&&<View style={{flexDirection:'row',gap:5,alignItems:'center'}}><ActivityIndicator size="small" color={p.muted}/><Text style={{color:p.muted,fontSize:11}}>Checking return battery…</Text></View>}{custom&&back?.failed&&<Text style={{color:'#E49235',fontSize:12}}>Return route unavailable. Battery estimate covers the outward trip only.</Text>}{plan.warning&&<Text accessibilityRole="alert" style={{color:'#E49235',fontSize:12,fontWeight:'700'}}>Battery reserve may be insufficient.</Text>}<Text style={{color:plan.warning?'#E49235':p.muted,fontSize:12}}>{custom&&back?.route?t('Return to {place}').replace('{place}',place?.name||t('Ride starting point')):t(plan.returnTrip?'Same-route return included':'One-way battery plan')} · ≈{plan.needed.toFixed(0)}% · {t('Reserve')} {plan.reserve}%{plan.remaining!==null?` · ${t('Estimated arrival charge')} ${Math.max(0,plan.remaining).toFixed(0)}%`:''}</Text>{actual===null&&cached.source==='last-reading'&&<Text style={{color:p.muted,fontSize:11}}>Based on the last vehicle reading, adjusted for time.</Text>}{actual===null&&cached.source==='assumed'&&<Text style={{color:'#E49235',fontSize:11}}>{t('Assuming {percent}% battery').replace('{percent}',cached.percent.toFixed(0))}</Text>}{plan.returnTrip&&<Text style={{color:p.muted,fontSize:11}}>{t('Return leg')} · ≈{plan.returnNeeded.toFixed(0)}%</Text>}</View>;
}
