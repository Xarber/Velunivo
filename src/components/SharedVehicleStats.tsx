import React,{useEffect,useState} from 'react';
import {View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import Text from './LocalizedText';
import {Button,Field,styles,usePalette} from './ui';
import {recordedRides,subscribeRides} from '../services/rideHistory';
import {vehicleUsage} from '../core/vehicleUsage';
import {distanceLeft} from '../core/rideView';
import {useStore} from '../services/store';
export default function SharedVehicleStats(){const p=usePalette(),{navigationOptions}=useStore(),[stats,setStats]=useState({rides:0,meters:0}),[compare,setCompare]=useState(false),[grams,setGrams]=useState('120');
 useEffect(()=>{let live=true;const refresh=()=>void recordedRides().then(r=>{if(live)setStats(vehicleUsage(r,'sharing-scooter'));}).catch(()=>{});refresh();const remove=subscribeRides(refresh);return()=>{live=false;remove();};},[]);
 return <View style={[styles.card,{backgroundColor:p.card}]}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Ionicons name="leaf-outline" size={24} color={p.accent}/><Text style={{color:p.text,fontSize:18,fontWeight:'700'}}>Your shared rides</Text></View><Text style={{color:p.text}}>Recorded rides · {stats.rides}</Text><Text style={{color:p.text}}>Distance travelled · {distanceLeft(stats.meters,navigationOptions.unit)}</Text><Button title={compare?'Hide car comparison':'Compare with a car'} icon="leaf-outline" secondary onPress={()=>setCompare(v=>!v)}/>{compare&&<><Field label="Car tailpipe emissions · g/km" value={grams} keyboardType="decimal-pad" onChangeText={setGrams}/><Text style={{color:p.accent,fontWeight:'700'}}>Potential CO₂ avoided · {Number.isFinite(Number(grams))&&Number(grams)>=0?(stats.meters/1000*Number(grams)/1000).toFixed(1):'—'} kg</Text><Text style={{color:p.muted,fontSize:12,lineHeight:18}}>Scenario only: assumes every recorded rental replaced a car trip at the entered emissions rate. Scooter manufacturing, charging and fleet operations are excluded.</Text></>}</View>;
}
