import {currentActivityExtras} from '../services/activityExtras';
import {handleRidingPromptLock} from '../services/ridingPrompt';
import {publishAutomaticRecordingView} from '../services/automaticRecordingView';
import {wakeRegistrationDecision} from '../core/bluetoothStartup';
import {canPairVehicle} from '../bluetooth/policy';
import {diagnostic} from '../core/diagnosticEvents';
import {useM365RideControls} from '../bluetooth/plugins/useM365RideControls';
import {armAutomaticRideWake,stopAutomaticRideWake,setAutomaticRideWakeActivity} from '../services/automaticRideWake';
// SPDX-License-Identifier: AGPL-3.0-only
import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {router,usePathname} from 'expo-router';
import {useGroupActivity} from '../groups/useGroupActivity';
import {AutomaticConnectionAlert,AutomaticRideDetector,AUTOMATIC_RIDE_COOLDOWN,AUTOMATIC_RIDE_DISCONNECT_GRACE} from '../core/automaticRide';
import {useStore} from '../services/store';
import {bluetoothBridge} from '../bluetooth/service';
import {useBluetoothVehicle,useBluetoothLease,useBluetoothPreferences} from '../bluetooth/react';
import {beginBackgroundLocation} from '../services/backgroundLocation';
import {useTripLocation} from '../services/useTripLocation';
import {useRideRecorder} from '../services/useRideRecorder';
import {notifyRideEvent} from '../services/localNotifications';
import {isRideLocked,setRideScreen} from '../services/rideLock';
import {requestRecordingStart} from '../services/recordingStartRequest';
import {useRecordingActivity,updateRecordingActivity,showRidingPromptActivity,stopRidingPromptActivity} from '../services/useNavigationActivity';
import {recordingActivity} from '../core/liveActivity';
import {t} from '../i18n/core';
const metadata={id:'automatic-bluetooth-ride',name:'Bluetooth ride',startLabel:'Trip start',endLabel:'Trip finish'};
const noMotion={accelerometer:null,gyroscope:null},noCompass={heading:null,timestamp:0};
/** A root-owned recorder survives tab changes. No background UI navigation is required. */
export default function AutomaticRideRecorder(){
 const {profile,navigationOptions:n,ready,vehicleLocked,lockVehicle}=useStore();
 const pathname=usePathname(),shownRecording=useRef(false);
 const {preferences,ready:bluetoothReady,associationsReady}=useBluetoothPreferences();
 const simulatedMode=n.developerMode&&preferences.simulateTelemetry;
 const snapshot=useBluetoothVehicle(profile.id);
 const [active,setActive]=useState(false),[,setSaving]=useState(false),[foreground,setForeground]=useState(AppState.currentState==='active'),[consented,setConsented]=useState(false),[consentLoaded,setConsentLoaded]=useState(false),[now,setNow]=useState(()=>Date.now()),[peak,setPeak]=useState(0),[error,setError]=useState('');
 const policy=useRef({enabled:false,notifyOnly:false});useEffect(()=>{policy.current={enabled:consented&&n.autoBluetoothRecording&&!simulatedMode,notifyOnly:n.bluetoothRecordingNotifyOnly};},[consented,n.autoBluetoothRecording,n.bluetoothRecordingNotifyOnly,simulatedMode]);
 const connectionAlert=useRef(new AutomaticConnectionAlert());
 const detector=useRef(new AutomaticRideDetector()),cooldown=useRef(0),armed=useRef(false),own=useRef(false),ending=useRef(false),disconnectedAt=useRef<number|null>(null);
 useM365RideControls(active,profile.id);
 useBluetoothLease(profile.id,active||(ready&&consented&&n.autoBluetoothRecording&&!simulatedMode));
 const recorder=useRideRecorder(active,true,false,metadata,profile,noMotion,noCompass,false);
 const accept=useCallback(async(fix:import('../core/types').Fix)=>{if(fix.speed!==null)setPeak(value=>Math.max(value,fix.speed!*3.6));await recorder.accept(fix);const ride=recorder.snapshot();if(n.liveActivities&&ride)await updateRecordingActivity({...recordingActivity(fix,ride.meters,ride.startedAt,n.unit,fix.timestamp),...currentActivityExtras(profile.id,fix.timestamp)});},[recorder,n.liveActivities,n.unit,profile.id]);
 const location=useTripLocation(active,true,accept);
 useRecordingActivity(active&&n.liveActivities,{...recordingActivity(location.fix,recorder.record?.meters??0,recorder.record?.startedAt??now,n.unit,now),...currentActivityExtras(profile.id,now)});
 const finish=useCallback(async()=>{
  if(!own.current)return true;if(ending.current)return false;
  ending.current=true;setSaving(true);cooldown.current=Date.now()+AUTOMATIC_RIDE_COOLDOWN;
  try{if(await recorder.finish()===false){setError('Automatic ride could not be saved. Try again.');return false;}own.current=false;setActive(false);lockVehicle(false);setError('');return true;}
  finally{ending.current=false;setSaving(false);}
 },[recorder,lockVehicle]);
 useGroupActivity(active,finish);
 useEffect(()=>{publishAutomaticRecordingView(active?{peak,recorder:{...recorder,error:error||recorder.error,finish},location}:null);},[active,recorder,finish,location,error,peak]);
 useEffect(()=>()=>publishAutomaticRecordingView(null),[]);
 useEffect(()=>{if(!active||!foreground){shownRecording.current=false;return;}if(shownRecording.current)return;shownRecording.current=true;if(pathname!=='/offline/record-trip')router.replace('/offline/record-trip');},[active,foreground,pathname]);
 const finishRef=useRef(finish);useEffect(()=>{finishRef.current=finish;},[finish]);
 useEffect(()=>{let cancelled=false;void AsyncStorage.getItem('automatic-ride-consent-v1').then(v=>{if(!cancelled)setConsented(v==='true');}).catch(()=>{}).finally(()=>{if(!cancelled)setConsentLoaded(true);});return()=>{cancelled=true;};},[n.autoBluetoothRecording]);
 useEffect(()=>{void setAutomaticRideWakeActivity(vehicleLocked).catch(()=>{});},[vehicleLocked]);
 const associationId=bluetoothBridge.association(profile.id)?.device.id;
 useEffect(()=>{
  if(Platform.OS!=='ios'||!ready||!bluetoothReady||!consentLoaded)return;
  const decision=wakeRegistrationDecision(consented&&n.autoBluetoothRecording&&!simulatedMode&&canPairVehicle(profile.id),associationsReady,!!associationId);
  if(decision==='stop'){void stopAutomaticRideWake().catch(()=>{});return;}
  // A locked keychain is not evidence that pairing was removed. Preserve the
  // native wake registration and prompt; retry secure loading after unlock.
  if(decision==='wait')return;
  void armAutomaticRideWake(profile.id).catch(()=>{});
 },[ready,bluetoothReady,associationsReady,consentLoaded,consented,n.autoBluetoothRecording,associationId,simulatedMode,profile.id]);
 useEffect(()=>{if(vehicleLocked||!n.autoBluetoothRecording)void stopRidingPromptActivity();},[vehicleLocked,n.autoBluetoothRecording]);
 useEffect(()=>{if(ready&&!n.autoBluetoothRecording)void stopAutomaticRideWake().catch(()=>{});},[ready,n.autoBluetoothRecording]);
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>sub.remove();},[]);
 useEffect(()=>{if(!active)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[active]);
 // Monitoring is armed while foregrounded with an actual connection and existing
 // Always permission. It stays active when locked, without collecting ride history.
 const connected=snapshot.state==='connected'&&!snapshot.simulated&&snapshot.vehicleId===profile.id;
 useEffect(()=>{if(Platform.OS!=='ios')return;if(ready&&consented&&n.autoBluetoothRecording&&n.liveActivities&&connected&&!active&&!vehicleLocked&&Date.now()>=cooldown.current)void showRidingPromptActivity(profile.id);else if(!active)void stopRidingPromptActivity();},[ready,consented,n.autoBluetoothRecording,n.liveActivities,connected,active,vehicleLocked,foreground,profile.id,snapshot]);
 useEffect(()=>{
  if(Platform.OS==='web'||!ready||!consented||!n.autoBluetoothRecording||!connected||vehicleLocked||active)return;
  let cancelled=false,wakeArmed=false,arming=false,stop:(()=>Promise<void>)|undefined;
  const arm=async()=>{
   if(arming||stop)return;arming=true;
   try{if(!(await Location.getBackgroundPermissionsAsync()).granted||cancelled)return;
    const release=await beginBackgroundLocation(async fix=>{if(!wakeArmed&&fix.accuracy<=100){wakeArmed=true;await armAutomaticRideWake(profile.id,fix.coordinate).catch(()=>{wakeArmed=false;});}},()=>{armed.current=false;},()=>cancelled,true);
    if(cancelled){await release();return;}stop=release;armed.current=true;diagnostic('automatic-ride','monitor-armed');
   }catch(error){armed.current=false;diagnostic('automatic-ride','monitor-failed',{message:error instanceof Error?error.message:'Monitoring failed'});}finally{arming=false;}
  };
  void arm();void armAutomaticRideWake(profile.id).catch(()=>{});const sub=AppState.addEventListener('change',state=>{if(state==='active'&&!stop)void arm();});
  return()=>{cancelled=true;armed.current=false;sub.remove();void stop?.();};
 },[ready,consented,n.autoBluetoothRecording,connected,profile.id,vehicleLocked,active]);
 useEffect(()=>{
  if(Platform.OS==='web')return;
  const enabled=ready&&consented&&n.autoBluetoothRecording&&!active&&!isRideLocked();
  if(!connectionAlert.current.accept(snapshot,profile.id,enabled,foreground,Date.now()))return;
  void (async()=>{
   const previous=Number(await AsyncStorage.getItem('automatic-ride-alert-at-v1'))||0;
   if(Date.now()-previous<AUTOMATIC_RIDE_COOLDOWN||!policy.current.enabled||isRideLocked())return;
   const current=bluetoothBridge.getSnapshot();if(current.state!=='connected'||current.vehicleId!==profile.id||current.connectedAt!==snapshot.connectedAt)return;
   const sent=await notifyRideEvent('bluetooth-ride-detected','Vehicle connected',t('Tap to start recording your Bluetooth ride.'),'velunivo:///offline/record-trip');
   if(sent)await AsyncStorage.setItem('automatic-ride-alert-at-v1',String(Date.now()));
   diagnostic('automatic-ride','connection-alert-result',{sent});
  })().catch(()=>diagnostic('automatic-ride','connection-alert-failed'));
 },[snapshot,profile.id,ready,consented,n.autoBluetoothRecording,active,foreground]);
 useEffect(()=>{
  if(Platform.OS==='web'||!ready||!consented||!n.autoBluetoothRecording||active||isRideLocked()||Date.now()<cooldown.current){detector.current.reset();return;}
  if(!detector.current.accept(snapshot,profile.id,Date.now()))return;
  detector.current.reset();cooldown.current=Date.now()+AUTOMATIC_RIDE_COOLDOWN;
  void (async()=>{
   const permission=await Location.getForegroundPermissionsAsync();
   const current=bluetoothBridge.getSnapshot();
   if(!policy.current.enabled||isRideLocked()||current.state!=='connected'||current.simulated||current.vehicleId!==profile.id)return;
   if(policy.current.notifyOnly||!permission.granted||(!armed.current&&AppState.currentState!=='active')){
    if(n.liveActivities&&await showRidingPromptActivity(profile.id))return;
    await notifyRideEvent('bluetooth-ride-detected','Looks like you’re riding',t('Tap to start recording your Bluetooth ride.'),'velunivo:///offline/record-trip');return;
   }
   own.current=true;lockVehicle(true);setRideScreen('/offline/record-trip');setPeak(0);setActive(true);setError('');
   await notifyRideEvent('bluetooth-recording-started','Automatic recording started',t('Your ride is being recorded. Open Velunivo to finish and save it.'));
  })().catch(()=>setError('Automatic recording could not start. Open the app and try again.'));
 },[snapshot,profile.id,ready,consented,n.autoBluetoothRecording,n.bluetoothRecordingNotifyOnly,n.liveActivities,active,lockVehicle]);
 useEffect(()=>{
  if(!active)return;
  if(!n.autoBluetoothRecording){void finishRef.current();return;}
  if(connected){disconnectedAt.current=null;return;}
  disconnectedAt.current??=Date.now();
  if(now-disconnectedAt.current>=AUTOMATIC_RIDE_DISCONNECT_GRACE)void finishRef.current();
 },[active,connected,now,n.autoBluetoothRecording]);
 // Only our own local alert can request a recording. A notification is not proof
 // of permission, and must not replace any ride already in progress.
 useEffect(()=>{
  if(Platform.OS==='web')return;
  const open=(response:Notifications.NotificationResponse|null)=>{
   if(response?.notification.request.content.data?.url!=='velunivo:///offline/record-trip')return;
   void Notifications.clearLastNotificationResponseAsync();
   if(isRideLocked()||Date.now()-response.notification.date>10*60*1000)return;
   void stopRidingPromptActivity();if(response.actionIdentifier==='SEARCH_DESTINATION'){router.push('/?plan=1');return;}requestRecordingStart();router.push('/offline/record-trip');
  };
  const sub=Notifications.addNotificationResponseReceivedListener(open);
  void Notifications.getLastNotificationResponseAsync().then(open).catch(()=>{});
  return()=>sub.remove();
 },[]);
 useEffect(()=>()=>{if(own.current){own.current=false;lockVehicle(false);}},[lockVehicle]);

 useEffect(()=>{
  if(Platform.OS!=='ios')return;let alive=true,sub:{remove():void}|undefined;
  void import('expo-widgets').then(({addUserInteractionListener})=>{if(!alive)return;sub=addUserInteractionListener(event=>{if(isRideLocked()||Math.abs(Date.now()-event.timestamp)>120000||event.source!=='VelunivoRidingPrompt')return;if(event.target?.startsWith('ride-prompt:lock:')||event.target?.startsWith('ride-prompt:unlock:')){void handleRidingPromptLock(event.target).catch(()=>notifyRideEvent('vehicle-control-failed','Vehicle control failed',t('The scooter did not confirm the lock change. Check it before leaving.')));return;}if(event.target==='ride-prompt:record'){void stopRidingPromptActivity();requestRecordingStart();router.push('/offline/record-trip');}else if(event.target==='ride-prompt:search'){void stopRidingPromptActivity();router.push('/?plan=1');}});}).catch(()=>{});
  return()=>{alive=false;sub?.remove();};
 },[]);
 return null;
}
