import { Metric, Reading, Telemetry, TelemetryUpdate } from './types';
export const units:Record<Metric,Reading['unit']>={speed:'m/s',batteryPercent:'%',voltage:'V',current:'A',charging:'boolean',batteryTemperature:'°C',controllerTemperature:'°C',motorTemperature:'°C',power:'W',odometer:'m',tripDistance:'m',chargeCycles:'count',ridingMode:'text',remainingRange:'m',signal:'dBm'};
const limits:Partial<Record<Metric,[number,number]>>={speed:[0,55],batteryPercent:[0,100],voltage:[0,150],current:[-300,300],power:[-45000,45000],batteryTemperature:[-40,120],controllerTemperature:[-40,180],motorTemperature:[-40,250],odometer:[0,1e9],tripDistance:[0,1e7],chargeCycles:[0,100000],remainingRange:[0,1e6],signal:[-127,20]};
export function normalize(update:TelemetryUpdate,supported:readonly Metric[],previous:Telemetry={},now=Date.now()):Telemetry {
 const next={...previous};for(const field of supported){const r=update.fields[field];if(!r || r.unit!==units[field] || !['vehicle','calculated','gps','simulator'].includes(r.source) || !Number.isFinite(r.timestamp) || r.timestamp>now+2000 || r.timestamp<(previous[field]?.timestamp ?? 0))continue;
 const bound=limits[field];if(bound && (typeof r.value!=='number' || !Number.isFinite(r.value) || r.value<bound[0] || r.value>bound[1]))continue;
 if(field==='charging' && typeof r.value!=='boolean' || field==='ridingMode' && (typeof r.value!=='string' || r.value.length>64))continue;next[field]={...r};}return next;
}
export function freshReading(fields:Telemetry,metric:Metric,now=Date.now(),actualOnly=true):Reading|undefined {const r=fields[metric],age=now-(r?.timestamp ?? 0),ttl=metric==='speed'?3000:metric==='signal'?15000:30000;return r && age>=-2000 && age<=ttl && (!actualOnly || r.source==='vehicle')?r:undefined;}
export const batteryColor=(percent:number)=>percent<20?'#D75451':percent<40?'#E49235':undefined;

export const metricLabels:Record<Metric,string>={speed:'Speed',batteryPercent:'Vehicle battery',voltage:'Battery voltage',current:'Battery current',charging:'Charging status',batteryTemperature:'Battery temperature',controllerTemperature:'Controller temperature',motorTemperature:'Motor temperature',power:'Electrical power',odometer:'Odometer',tripDistance:'Trip distance',chargeCycles:'Charge cycles',ridingMode:'Riding mode',remainingRange:'Remaining range',signal:'Signal strength'};
