import React,{useState} from 'react';
import { Platform,Text,View } from 'react-native';
import { activityDiagnosis,ActivityReport } from '../core/activityDiagnostics';
import { inspectLiveActivity } from '../services/useNavigationActivity';
import { Button,styles,usePalette } from './ui';
export default function ActivityDiagnostics({developerMode}:{developerMode:boolean}) {
 const p=usePalette(),[report,setReport]=useState<ActivityReport|null>(null),[error,setError]=useState('');
 if(Platform.OS!=='ios')return null;
 return <View style={[styles.card,{backgroundColor:p.card}]}><Text style={{color:p.text,fontSize:18,fontWeight:'700'}}>Live Activity check</Text><Text style={{color:p.muted}}>Check during a ride if navigation is missing from the Lock Screen. This reads the installation and does not change permissions.</Text><Button title="Check Live Activity" icon="pulse-outline" onPress={()=>{try{setReport(inspectLiveActivity());setError('');}catch(e){setError(e instanceof Error ? e.message : String(e));}}} />{report && <Text accessibilityLiveRegion="polite" style={{color:p.text,lineHeight:22}}>{activityDiagnosis(report)}</Text>}{error && <Text accessibilityRole="alert" style={{color:p.text}}>{error}</Text>}{report && developerMode && <Text selectable style={{color:p.muted,fontSize:12}}>{JSON.stringify(report,null,2)}</Text>}</View>;
}
