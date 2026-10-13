import {useStore} from '../services/store';
import React,{useState,useEffect,useMemo} from 'react';
import {View} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {explorationProgress,emptyExplorationProgress,explorationAchievements} from '../core/explorationProgress';
import {RecordedRide} from '../core/recordings';
import {useScratchIndex} from '../services/scratchMap';
import {recordedRides,subscribeRides} from '../services/rideHistory';
import {readExplorationProgress,persistExplorationProgress} from '../services/explorationProgress';
import Text from './LocalizedText';
import {styles,usePalette,Button} from './ui';
import {t} from '../i18n/core';
export default function ExplorationProfile({details=false}:{details?:boolean}){const p=usePalette(),{navigationOptions:n}=useStore(),{index}=useScratchIndex(),[rides,setRides]=useState<RecordedRide[]>([]),[previous,setPrevious]=useState(emptyExplorationProgress),[loaded,setLoaded]=useState(false);
 useEffect(()=>{let mounted=true;void readExplorationProgress().then(v=>{if(mounted){setPrevious(v);setLoaded(true);}});const refresh=()=>void recordedRides().then(v=>{if(mounted)setRides(v);}).catch(()=>{});refresh();const remove=subscribeRides(refresh);return()=>{mounted=false;remove();};},[]);
 const progress=useMemo(()=>explorationProgress(index,rides,previous),[index,rides,previous]);
 useEffect(()=>{if(loaded)void persistExplorationProgress(progress.progress).catch(()=>{});},[loaded,progress]);
 return <View style={[styles.card,{backgroundColor:p.card}]}><View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Ionicons name="compass-outline" color={p.accent} size={30}/><View style={{flex:1}}><Text style={{color:p.text,fontSize:20,fontWeight:'800'}}>{t('Explorer level')} {progress.level}</Text><Text translate={false} style={{color:p.muted}}>{progress.progress.xp} / {progress.nextXP} XP</Text></View></View><View accessibilityRole="progressbar" accessibilityValue={{min:0,max:100,now:Math.round(progress.levelFraction*100)}} style={{height:8,borderRadius:4,backgroundColor:p.line,overflow:'hidden'}}><View style={{height:8,width:`${progress.levelFraction*100}%`,backgroundColor:p.accent}}/></View><Text style={{color:p.text,fontWeight:'700'}}>This week</Text><Text style={{color:p.muted}}>{progress.weeklyTiles} / {progress.weeklyGoal} {t('new tiles')}</Text>{details?<><Text style={{color:p.text,fontWeight:'700'}}>Achievements</Text>{explorationAchievements.map(a=><View key={a.id} style={{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:8,opacity:progress.progress.achievements.includes(a.id)?1:.5}}><Ionicons name={a.icon} color={p.accent} size={26}/><View style={{flex:1}}><Text style={{color:p.text,fontWeight:'700'}}>{a.name}</Text><Text style={{color:p.muted}}>{(Math.min(progress.values[a.kind],a.goal)/(a.kind==='km'&&n.unit==='mi'?1.609344:1)).toFixed(a.kind==='km'?1:0)} / {(a.goal/(a.kind==='km'&&n.unit==='mi'?1.609344:1)).toFixed(a.kind==='km'?1:0)} {t(a.kind==='km'?n.unit:a.kind==='rides'?'rides':'tiles')}</Text></View>{progress.progress.achievements.includes(a.id)&&<Ionicons name="checkmark-circle" color={p.accent} size={22}/>}</View>)}<Text style={{color:p.muted,fontSize:12}}>Real rides and new GPS tiles earn XP. Levels and achievements stay earned after deleting rides or resetting your scratch map.</Text></>:<Button title={t('Achievements & challenges')} icon="trophy-outline" secondary onPress={()=>router.push('/settings/exploration')}/>}</View>;
}
