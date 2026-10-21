import React,{useEffect,useState} from 'react';
import {View,ScrollView,ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RecordedRide} from '../core/recordings';
import {recordedRides} from '../services/rideHistory';
import {rideInsightTrends} from '../core/rideInsightTrends';
import {goBack} from '../services/navigation';
import {useStore} from '../services/store';
import Text from './LocalizedText';
import {IconButton,Button,usePalette,styles} from './ui';
import DetailRow from './DetailRow';
import RideInsights from './RideInsights';
import TelemetryChart from './TelemetryChart';
import {t} from '../i18n/core';
export default function RideInsightsScreen(){
 const p=usePalette(),{navigationOptions:n}=useStore(),[rides,setRides]=useState<RecordedRide[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState(false),[vehicle,setVehicle]=useState(''),[selected,setSelected]=useState<number|null>(null);
 useEffect(()=>{let alive=true;void recordedRides().then(v=>{if(alive)setRides(v);}).catch(()=>{if(alive)setError(true);}).finally(()=>{if(alive)setBusy(false);});return()=>{alive=false;};},[]);
 const filtered=rides.filter(r=>!vehicle||r.vehicle.id===vehicle);
 const points=rideInsightTrends(filtered);
 const vehicles=[...new Map(rides.map(r=>[r.vehicle.id,r.vehicle.name])).entries()];
 const scale=n.unit==='mi'?1/1.609344:1;
 return <SafeAreaView edges={['top','left','right']} style={{flex:1,backgroundColor:p.bg}}><ScrollView contentContainerStyle={{padding:22,paddingBottom:100,gap:18,width:'100%',maxWidth:780,alignSelf:'center'}}><View style={{flexDirection:'row',gap:14,alignItems:'center'}}><IconButton label={t('Back')} icon="chevron-back" onPress={()=>goBack('/offline/rides')}/><Text style={[styles.title,{color:p.text,flex:1}]}>Ride insights</Text></View>{busy?<ActivityIndicator color={p.accent}/>:error?<Text style={{color:p.muted}}>Could not read ride analytics.</Text>:<><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}><Button title={t('All vehicles')} secondary={vehicle!==''} onPress={()=>{setVehicle('');setSelected(null);}}/>{vehicles.map(([id,name])=><Button key={id} title={name} secondary={vehicle!==id} onPress={()=>{setVehicle(id);setSelected(null);}}/>)}</ScrollView><RideInsights rides={filtered} unit={n.unit} details/>{points.length<2?<Text style={{color:p.muted}}>Record at least two rides to see trends.</Text>:<><DetailRow icon="trending-up-outline" heading><Text style={{color:p.text,fontSize:20,fontWeight:'700'}}>Values over time</Text></DetailRow><Text style={{color:p.muted,fontSize:12}}>Each point is one ride. Select a point to see its date and values. Pace includes stops; battery use is shown only when recorded.</Text>{selected!==null&&points[selected]&&<Text translate={false} style={{color:p.accent}}>{new Date(points[selected].at).toLocaleString()}</Text>}<TelemetryChart title={t('Ride distance')} points={points} field="distanceKm" unit={n.unit} scale={scale} selected={selected} onSelect={setSelected} maxGap={Infinity}/><TelemetryChart title={t('Overall pace')} points={points} field="speedKmh" unit={n.unit==='mi'?'mph':'km/h'} scale={scale} selected={selected} onSelect={setSelected} maxGap={Infinity}/><TelemetryChart title={t('Ride duration')} points={points} field="durationMinutes" unit={t('min')} selected={selected} onSelect={setSelected} maxGap={Infinity}/><TelemetryChart title={t('Battery usage')} points={points} field="battery" unit="%" selected={selected} onSelect={setSelected} maxGap={Infinity}/></>}</>}</ScrollView></SafeAreaView>;
}
