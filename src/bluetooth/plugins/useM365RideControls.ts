import {useEffect} from 'react';
import {bluetoothBridge} from '../service';
import {M365_CONTROL_PLUGIN} from './m365ControlPolicy';
import {m365RideAction} from './m365RideControls';
/** Route and recording activity, independent of whether history collection is on. */
export function useM365RideControls(active:boolean,vehicleId:string){
 useEffect(()=>{if(!active||bluetoothBridge.association(vehicleId)?.pluginId!==M365_CONTROL_PLUGIN)return;const release=bluetoothBridge.acquire(vehicleId);const session=`${Date.now()}-${Math.random()}`;void m365RideAction(vehicleId,session,'start');return()=>{void m365RideAction(vehicleId,session,'finish').finally(release);};},[active,vehicleId]);
}
