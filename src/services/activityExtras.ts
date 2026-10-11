import {bluetoothBridge} from '../bluetooth/service';
import {getBluetoothPreferences} from '../bluetooth/preferences';
import {getHostPresence} from '../sharing/hostPresence';
import {activityExtras} from '../core/activityTelemetry';
export const currentActivityExtras=(vehicleId:string,now=Date.now())=>activityExtras(bluetoothBridge.getSnapshot(),getBluetoothPreferences(),vehicleId,getHostPresence(),now);
