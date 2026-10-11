// Independently implemented wire format; protocol references and attribution: docs/BLUETOOTH.md.
import { TelemetryUpdate, Reading, Metric } from '../types';
import { units } from '../telemetry';
export const NUS='6e400001-b5a3-f393-e0a9-e50e24dcca9e',TX='6e400002-b5a3-f393-e0a9-e50e24dcca9e',RX='6e400003-b5a3-f393-e0a9-e50e24dcca9e';
export const reads=[{target:0x20,reg:0xb4,size:16},{target:0x22,reg:0x31,size:10},{target:0x20,reg:0xb9,size:2}];
export function readPacket(target:number,reg:number,size:number){if(![...reads,{target:0x20,reg:0x10,size:14},{target:0x20,reg:0x1a,size:2}].some(r=>r.target===target && r.reg===reg && r.size===size))throw new Error('Read register not allowlisted');const body=[3,target,1,reg,size],crc=(body.reduce((n,b)=>n+b,0)^0xffff)&0xffff;return Uint8Array.from([0x55,0xaa,...body,crc&255,crc>>8]);}
export function validPlain(bytes:Uint8Array){if(bytes.length<8 || bytes[0]!==0x55 || bytes[1]!==0xaa || bytes.length!==bytes[2]+6)return false;const crc=(bytes.slice(2,-2).reduce((n,b)=>n+b,0)^0xffff)&65535;return bytes.at(-2)===(crc&255) && bytes.at(-1)===(crc>>8);}
export class PacketStream {private buffer:number[]=[];feed(data:Uint8Array){this.buffer.push(...data);if(this.buffer.length>2048)this.buffer=this.buffer.slice(-512);const out:Uint8Array[]=[];while(this.buffer.length>=3){const encrypted=this.buffer[0]===0x5a && this.buffer[1]===0xa5,mi=this.buffer[0]===0x55 && this.buffer[1]===0xab,plain=this.buffer[0]===0x55 && this.buffer[1]===0xaa;if(!encrypted && !plain && !mi){this.buffer.shift();continue;}const size=this.buffer[2]+(mi?16:encrypted?13:6);if(size>256){this.buffer.shift();continue;}if(this.buffer.length<size)break;out.push(Uint8Array.from(this.buffer.splice(0,size)));}return out;}}
export function decodeRead(sender:number,reg:number,data:Uint8Array,now=Date.now()):TelemetryUpdate {
 const extensions:Record<string,Reading>={},fields:TelemetryUpdate['fields']={},view=new DataView(data.buffer,data.byteOffset,data.byteLength);
 const put=(m:Metric,value:Reading['value'],source:Reading['source']='vehicle')=>{fields[m]={value,timestamp:now,source,unit:units[m]};};
 if(sender===0x23 && reg===0xb4 && data.length===16){put('batteryPercent',view.getUint16(0,true));put('speed',view.getInt16(2,true)/3600);put('odometer',view.getUint32(6,true));extensions.frameTemperature={value:view.getInt16(14,true)/10,timestamp:now,source:'vehicle',unit:'°C'};}
 if(sender===0x23 && reg===0xb9 && data.length===2)put('tripDistance',view.getUint16(0,true));
 if(sender===0x25 && reg===0x31 && data.length===10){put('batteryPercent',view.getUint16(2,true));put('current',view.getInt16(4,true)/100);put('voltage',view.getUint16(6,true)/100);put('batteryTemperature',Math.max(data[8],data[9])-20);put('power',Number(fields.current!.value)*Number(fields.voltage!.value),'calculated');}
 // Negative current can be regenerative braking: charging status is deliberately unsupported.
 return {fields,extensions};
}
