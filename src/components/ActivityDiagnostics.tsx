import React,{useState} from 'react';
import { Platform,Text,View } from 'react-native';
import { activityDiagnosis,ActivityReport } from '../core/activityDiagnostics';
import { inspectLiveActivity,startTestLiveActivity,stopTestLiveActivity } from '../services/useNavigationActivity';
import { Button,styles,usePalette } from './ui';
export default function ActivityDiagnostics({developerMode,rideActive}:{developerMode:boolean;rideActive:boolean}) {
 const p=usePalette(),[report,setReport]=useState<ActivityReport|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 if(Platform.OS!=='ios')return null;
 async function testActivity(stop=false) {
  setBusy(true);setError('');
  try {
   if(stop){await stopTestLiveActivity();setReport(inspectLiveActivity());setMessage('Test ended.');}
   else{setReport(await startTestLiveActivity());setMessage('Test requested. Lock your iPhone to check for “Live Activity test”. It ends after 90 seconds while the app is running; use Stop test if it remains.');}
  }catch(e){setError(e instanceof Error ? e.message : String(e));}
  finally{setBusy(false);}
 }
 return <View style={[styles.card,{backgroundColor:p.card}]}><Text style={{color:p.text,fontSize:18,fontWeight:'700'}}>Live Activity check</Text><Text style={{color:p.muted}}>Temporary test controls. No ride, GPS or recording is needed. Check during a ride if navigation is missing from the Lock Screen.</Text><Button title="Test Live Activity" icon="play-outline" disabled={busy||rideActive} onPress={()=>void testActivity()} /><Button title="Stop test" icon="stop-outline" secondary disabled={busy} onPress={()=>void testActivity(true)} />{rideActive && <Text style={{color:p.muted}}>End your current ride before starting a test.</Text>}<Button title="Check Live Activity" icon="pulse-outline" onPress={()=>{try{setReport(inspectLiveActivity());setError('');}catch(e){setError(e instanceof Error ? e.message : String(e));}}} />{message && <Text accessibilityLiveRegion="polite" style={{color:p.text}}>{message}</Text>}{report && <Text accessibilityLiveRegion="polite" style={{color:p.text,lineHeight:22}}>{activityDiagnosis(report)}</Text>}{error && <Text accessibilityRole="alert" style={{color:p.text}}>{error}</Text>}{report && developerMode && <Text selectable style={{color:p.muted,fontSize:12}}>{JSON.stringify(report,null,2)}</Text>}</View>;
}
