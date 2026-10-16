import CosmeticRewards from './CosmeticRewards';
import React,{useEffect,useState,useRef,useMemo} from 'react';
import {View,Pressable} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {router} from 'expo-router';
import {AreaChallenge,areaChallenge,completedChallenges,cosmeticThemes,localDay} from '../core/explorationChallenges';
import {ExplorationProgress} from '../core/explorationProgress';
import {ScratchIndex} from '../core/scratchMap';
import {useLocation} from '../services/useLocation';
import {reverseAreaName} from '../services/api';
import {persistExplorationProgress} from '../services/explorationProgress';
import {useStore} from '../services/store';
import {styles,usePalette,Button} from './ui';
import Text from './LocalizedText';
import {t} from '../i18n/core';
export default function ExplorationChallenges({index,progress,onEarned}:{index:ScratchIndex;progress:ExplorationProgress;onEarned:(p:ExplorationProgress)=>void}){
 const preparing=useRef(false);const p=usePalette(),{navigationOptions:n,updateNavigationOptions,requestJourney}=useStore(),location=useLocation(true),[area,setArea]=useState<AreaChallenge|null>(null),[ready,setReady]=useState(false),[now]=useState(()=>Date.now());
 useEffect(()=>{let alive=true;void AsyncStorage.getItem('exploration-daily-area-v1').then(raw=>{if(!alive)return;try{const old=JSON.parse(raw||'null');if(old?.day===localDay(now)&&Array.isArray(old.coordinate)&&old.coordinate.length===2&&old.coordinate.every(Number.isFinite)&&typeof old.name==='string')setArea(old);}catch{}setReady(true);});return()=>{alive=false;};},[now]);
 useEffect(()=>{if(preparing.current||!ready||area||!location.fix||location.fix.accuracy>75)return;const target=areaChallenge(location.fix.coordinate,index,now);if(!target)return;preparing.current=true;void Promise.resolve().then(async()=>{setArea(target);await AsyncStorage.setItem('exploration-daily-area-v1',JSON.stringify(target));const [lon,lat]=target.coordinate,name=await reverseAreaName([lon-.003,lat-.003,lon+.003,lat+.003])||'',named={...target,name};setArea(named);await AsyncStorage.setItem('exploration-daily-area-v1',JSON.stringify(named));}).catch(()=>{});},[ready,area,location.fix,index,now]);
 const daily=useMemo(()=>completedChallenges(index,area,now),[index,area,now]),unclaimed=Object.keys(daily.earned).some(id=>!progress.quests?.[id]);
 useEffect(()=>{if(!unclaimed)return;const updated={...progress,quests:{...progress.quests,...daily.earned}};onEarned(updated);void persistExplorationProgress(updated);},[unclaimed,daily.earned,progress,onEarned]);
 return <><View style={{gap:8,padding:14,borderRadius:16,backgroundColor:p.bg}}><Text style={{color:p.text,fontWeight:'700'}}>Daily discovery</Text><Text style={{color:p.muted}}>{Math.min(daily.count,daily.quest.goal)} / {daily.quest.goal} {t('new tiles')} · {daily.quest.xp} XP</Text>{!!progress.quests?.[daily.quest.id]&&<Text style={{color:p.accent}}>Completed</Text>}</View>{area&&<View style={{gap:8,padding:14,borderRadius:16,backgroundColor:p.bg}}><Text style={{color:p.text,fontWeight:'700'}}>Today’s neighbourhood</Text><Text translate={false} numberOfLines={2} style={{color:p.muted}}>{area.name||t('Nearby unexplored area')} · 250 XP</Text>{progress.quests?.['area:'+area.day]?<Text style={{color:p.accent}}>Completed</Text>:<Button title={t('Plan a ride')} secondary icon="navigate-outline" onPress={()=>{requestJourney({start:[0,0],startCurrent:true,end:area.coordinate,startLabel:'Current location',endLabel:area.name||t('Nearby unexplored area'),requestedAt:Date.now()});router.navigate('/');}}/>}</View>}<Text style={{color:p.text,fontWeight:'700'}}>Explorer rewards</Text><View style={{gap:8}}>{cosmeticThemes.map(theme=><Pressable key={theme.id} accessibilityRole="button" accessibilityState={{disabled:progress.xp<theme.xp,selected:n.cosmeticTheme===theme.id}} disabled={progress.xp<theme.xp} onPress={()=>updateNavigationOptions({cosmeticTheme:theme.id})} style={[styles.card,{padding:12,flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:n.cosmeticTheme===theme.id?p.accent:p.line,opacity:progress.xp<theme.xp?.5:1}]}><View style={{width:24,height:24,borderRadius:12,backgroundColor:p.dark?theme.dark:theme.light}}/><Text style={{flex:1,color:p.text}}>{theme.name}</Text><Text translate={false} style={{color:p.muted,fontSize:12}}>{theme.xp} XP</Text></Pressable>)}</View><CosmeticRewards xp={progress.xp}/></>;
}
