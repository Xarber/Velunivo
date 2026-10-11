import {BridgeSnapshot} from '../bluetooth/types';
import {BluetoothPreferences,metricVisible} from '../bluetooth/preferences';
import {dashboardReading} from '../bluetooth/policy';
import {batteryColor} from '../bluetooth/telemetry';
export interface ActivityExtras {batteryPercent?:number;batteryColor?:string;batterySymbol?:'battery.0percent'|'battery.25percent'|'battery.50percent'|'battery.75percent'|'battery.100percent'|'battery.100percent.bolt';viewerCount?:number;}
/** ActivityKit receives only fresh connected readings for the active vehicle. */
export function activityExtras(snapshot:BridgeSnapshot,preferences:BluetoothPreferences,vehicleId:string,presence:{sharing:boolean;viewers:number},now:number):ActivityExtras {
 const result:ActivityExtras={};
 const battery=metricVisible(preferences,'batteryPercent')?dashboardReading(snapshot,vehicleId,'batteryPercent',now):undefined;
 if(typeof battery?.value==='number' && Number.isFinite(battery.value) && battery.value>=0 && battery.value<=100){
  const percent=Math.round(battery.value);result.batteryPercent=percent;result.batteryColor=batteryColor(percent) || '#28DAB0';
  const charging=metricVisible(preferences,'charging') && dashboardReading(snapshot,vehicleId,'charging',now)?.value===true;
  result.batterySymbol=charging?'battery.100percent.bolt':`battery.${percent<13?0:percent<38?25:percent<63?50:percent<88?75:100}percent`;
 }
 if(presence.sharing)result.viewerCount=Math.max(0,Math.floor(presence.viewers));
 return result;
}
