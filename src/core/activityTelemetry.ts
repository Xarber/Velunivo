import {t} from '../i18n/core';
import {canPairVehicle,dashboardReading} from '../bluetooth/policy';
import {retainedReading,batteryColor} from '../bluetooth/telemetry';
import {BridgeSnapshot} from '../bluetooth/types';
import {BluetoothPreferences,metricVisible} from '../bluetooth/preferences';
export interface ActivityExtras {batteryPercent?:number;batteryOld?:boolean;batteryUpdatedAt?:number;oldLabel?:string;batteryColor?:string;batterySymbol?:'battery.0percent'|'battery.25percent'|'battery.50percent'|'battery.75percent'|'battery.100percent'|'battery.100percent.bolt';viewerCount?:number;}
/** ActivityKit retains the last verified battery with explicit age/stale state for the active vehicle. */
export function activityExtras(snapshot:BridgeSnapshot,preferences:BluetoothPreferences,vehicleId:string,presence:{sharing:boolean;viewers:number},now:number):ActivityExtras {
 const result:ActivityExtras={};
 const retained=canPairVehicle(vehicleId) && snapshot.vehicleId===vehicleId && metricVisible(preferences,'batteryPercent')?retainedReading(snapshot.fields,'batteryPercent',now):undefined;
 const candidate=retained?.reading;
 const battery=candidate && candidate.source===(snapshot.simulated?'simulator':'vehicle')?candidate:undefined;
 if(typeof battery?.value==='number' && Number.isFinite(battery.value) && battery.value>=0 && battery.value<=100){
  const percent=Math.round(battery.value);result.batteryPercent=percent;result.batteryUpdatedAt=battery.timestamp;result.batteryOld=snapshot.state!=='connected' || now-battery.timestamp>30000;result.oldLabel=t('Old');result.batteryColor=result.batteryOld?'#E49235':batteryColor(percent) || '#28DAB0';
  const charging=!result.batteryOld && metricVisible(preferences,'charging') && dashboardReading(snapshot,vehicleId,'charging',now)?.value===true;
  result.batterySymbol=charging?'battery.100percent.bolt':`battery.${percent<13?0:percent<38?25:percent<63?50:percent<88?75:100}percent`;
 }
 if(presence.sharing)result.viewerCount=Math.max(0,Math.floor(presence.viewers));
 return result;
}
