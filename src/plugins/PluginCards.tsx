import React from 'react';
import {View} from 'react-native';
import Text from '../components/LocalizedText';
import {Button,usePalette} from '../components/ui';
import {usePluginExtensions} from './PluginProvider';
import {PluginCard} from './model';
export default function PluginCards({slot}:{slot:PluginCard['slot']}){const p=usePalette(),{outputs,action}=usePluginExtensions();return <>{Object.entries(outputs).flatMap(([id,output])=>output.cards.filter(c=>c.slot===slot).map(card=><View key={id+':'+card.id} style={{padding:14,borderRadius:18,backgroundColor:p.card,gap:8}}><Text translate={false} style={{color:p.text,fontWeight:'700'}}>{card.title}</Text><Text translate={false} style={{color:p.muted,lineHeight:20}}>{card.text}</Text>{card.action&&<Button title={card.action.label} secondary onPress={()=>action(id,card.action!.id)}/>}</View>))}</>;}
