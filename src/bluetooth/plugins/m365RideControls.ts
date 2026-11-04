// SPDX-License-Identifier: AGPL-3.0-only
import AsyncStorage from '@react-native-async-storage/async-storage';
import {bluetoothBridge} from '../service';
import {defaultM365RideControls,restoreM365RideControls,m365ControlsAvailable,safeStationary,M365RideControls,M365_CONTROL_PLUGIN} from './m365ControlPolicy';
import {isRideLocked} from '../../services/rideLock';
import {notifyRideNotice} from '../../services/rideNotice';
const key=(id:string)=>'m365-ride-controls-v1:'+id;
export const loadM365RideControls=async(id:string)=>restoreM365RideControls(await AsyncStorage.getItem(key(id)));
export const saveM365RideControls=(id:string,p:M365RideControls)=>AsyncStorage.setItem(key(id),JSON.stringify({...defaultM365RideControls,...p}));
const completed=new Set<string>();
/** No queued locks or automatic pairing: late/unsafe actions must be skipped. */
export async function m365RideAction(vehicleId:string,rideId:string,phase:'start'|'finish'){
 const stamp=rideId+':'+phase;if(completed.has(stamp))return;completed.add(stamp);if(completed.size>200)completed.delete(completed.values().next().value!);
 try{
  const p=await loadM365RideControls(vehicleId);if(phase==='finish'&&isRideLocked())return;if(!(phase==='start'?p.unlockOnStart:p.lockOnFinish))return;
  if(phase==='start'&&completed.has(rideId+':finish'))return;
  if(phase==='start'&&bluetoothBridge.getSnapshot().state!=='connected'&&bluetoothBridge.association(vehicleId)?.pluginId===M365_CONTROL_PLUGIN)await bluetoothBridge.reconnect(vehicleId);
  if(phase==='start'&&completed.has(rideId+':finish'))return;
  const snapshot=bluetoothBridge.getSnapshot();
  const locked=snapshot.extensions.locked;if(m365ControlsAvailable(snapshot,vehicleId)&&locked?.source==='vehicle'&&Date.now()-locked.timestamp<10000&&locked.value===(phase==='finish'))return;
  if(!m365ControlsAvailable(snapshot,vehicleId)||!safeStationary(snapshot)){notifyRideNotice({title:'Vehicle control skipped',message:'Automatic lock or unlock was skipped. Connect the scooter and stop safely before using the manual control.'});return;}
  await bluetoothBridge.setLocked(vehicleId,phase==='finish');
 }catch{notifyRideNotice({title:'Vehicle control failed',message:'The scooter did not confirm the lock change. Check it before leaving.'});}
}
