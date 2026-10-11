import { VehicleApprovalRequiredError } from '../approvalRetry';
import { BLEDeviceInfo, VehicleProtocolPlugin, ProtocolSession, Capabilities } from '../types';
import { NUS, TX, RX, PacketStream, validPlain, readPacket, reads, decodeRead } from './m365Packets';
import {authenticateMi,MI,CONTROL,DATA,MiUART} from './miAuth';
import { LegacyCrypto } from './legacyCrypto';
const capabilities:Capabilities={fields:['speed','batteryPercent','voltage','current','power','batteryTemperature','odometer','tripDistance','signal'],commands:['readTelemetry'],authentication:'Mi FE95 registration and saved-token login, legacy UART or 5AA5 approval',limitations:['Mi FE95 communication requires physical hardware validation.','Pro 2 BLE129/compatible first-generation crypto requires hardware validation.','Charging, mode, cycles and motor/controller temperature are not declared: register semantics are not verified.','Current is positive discharge, negative return current; regeneration is not charging.']};
export const XiaomiM365Plugin:VehicleProtocolPlugin={id:'xiaomi-m365-v1',manufacturer:'Xiaomi',vehicleTypes:['electric_scooter'],models:['M365 family','Mi Electric Scooter Pro 2 (compatible BLE firmware)'],services:[NUS,MI],manufacturerFilters:[0x20,0x22,0x25,0x28,0x29,0x2b].flatMap(model=>[{companyIdentifier:0x424e,dataPrefix:[model]},{companyIdentifier:0x434e,dataPrefix:[0,model]}]),capabilities,
 detect(device:BLEDeviceInfo){
  const hasUART=device.services.some(x=>x.toLowerCase()===NUS),m=device.manufacturerData;
  const signature=!!m && m[0]===0x4e && ((m[1]===0x42 && [0x20,0x22,0x25,0x28,0x29,0x2b].includes(m[2])) || (m[1]===0x43 && m[2]===0 && [0x20,0x22,0x25,0x28,0x29,0x2b].includes(m[3])));
  // Names are user-editable, not vehicle identity. Browser candidates stay uncertain until a real handshake.
  return signature || (hasUART && device.verifiedProtocol==='xiaomi-m365-v1')
   ? {compatible:true,model:'Xiaomi M365 family'}
   : {compatible:false,uncertain:hasUART && device.discoverySource==='web-gatt',reason:'Requires a documented Xiaomi-family manufacturer advertisement signature or verified read-only vehicle identity and telemetry.'};
 },
 async open(link,ctx){
 if(ctx.signal?.aborted)throw new Error('Connection cancelled');
 if(!await link.hasCharacteristic(NUS,TX) || !await link.hasCharacteristic(NUS,RX))throw new Error('This device does not expose the supported vehicle data service.');
 let mi:MiUART|undefined;if(await link.hasCharacteristic(MI,CONTROL) && await link.hasCharacteristic(MI,DATA))mi=await authenticateMi(link,ctx);
 let closed=false,encrypted=false,crypto:LegacyCrypto|undefined,poll:ReturnType<typeof setTimeout>|undefined,failures=0,powerApproved=false;
 const stream=new PacketStream();let pending:{match:(body:Uint8Array)=>boolean;resolve:(body:Uint8Array)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}|undefined;
 const stop=link.monitor(NUS,RX,data=>{for(const packet of stream.feed(data)){try{const body=packet[1]===0xab?mi?.decrypt(packet):packet[0]===0x55?(validPlain(packet)?packet.slice(3,-2):undefined):crypto?.decrypt(packet);if(body?.[0]===0x21 && body[1]===0x3e && body[2]===0x5c && body[3]===1)powerApproved=true;if(body && pending?.match(body)){const waiter=pending;pending=undefined;clearTimeout(waiter.timer);waiter.resolve(body);}}catch{/* Bad checksums/replays are ignored; request timeout handles missing valid data. */}}},error=>{if(pending){clearTimeout(pending.timer);pending.reject(error);pending=undefined;}void link.disconnect().catch(()=>{});});
 const exchange=(wire:Uint8Array,match:(b:Uint8Array)=>boolean,timeout=1800)=>new Promise<Uint8Array>((resolve,reject)=>{if(closed){reject(new Error('Bluetooth session closed'));return;}const timer=setTimeout(()=>{pending=undefined;reject(new Error('Vehicle did not respond'));},timeout);pending={match,resolve,reject,timer};void link.write(NUS,TX,wire).catch(e=>{clearTimeout(timer);pending=undefined;reject(e);});});
 const read=async(target:number,reg:number,size:number)=>{const wire=mi?mi.encrypt(Uint8Array.from([target,1,reg,size])):encrypted?crypto!.encrypt(Uint8Array.from([0x3e,target,1,reg,size])):readPacket(target,reg,size);const body=await exchange(wire,b=>encrypted?b.length===size+4 && b[0]===(target===0x20?0x20:0x22) && b[1]===0x3e && b[2]===1 && b[3]===reg:b.length===size+3 && b[0]===(target===0x20?0x23:0x25) && b[1]===1 && b[2]===reg);return body.slice(encrypted?4:3);};
 const cancel=()=>{void close();};
 const close=async()=>{if(closed)return;closed=true;ctx.signal?.removeEventListener('abort',cancel);if(poll)clearTimeout(poll);stop();if(pending){clearTimeout(pending.timer);pending.reject(new Error('Bluetooth session closed'));pending=undefined;}};
 ctx.signal?.addEventListener('abort',cancel,{once:true});
 try{
 let serial:Uint8Array;
 try{serial=await read(0x20,0x10,14);}catch{
  if(closed)throw new Error('Connection cancelled');
  encrypted=true;crypto=new LegacyCrypto(link.device.name || '');ctx.phase('Checking encrypted vehicle authentication…');
  const first=await exchange(crypto.encrypt(Uint8Array.from([0x3e,0x21,0x5b,0])),b=>b[0]===0x21 && b[1]===0x3e && b[2]===0x5b && b.length===34,4000);serial=first.slice(20,34);
  const appKey=ctx.random(16);ctx.phase('Toggle the vehicle headlight to approve Velunivo. If it is already on, turn it off and back on with short power-button presses.');
  const approvalDeadline=ctx.approvalDeadline ?? Date.now()+5000;let approved=false;for(let retry=0;retry<5 && Date.now()<approvalDeadline && !approved && !closed;retry++){const at=Date.now();try{const response=await exchange(crypto.encrypt(Uint8Array.from([0x3e,0x21,0x5c,0,...appKey])),b=>b[0]===0x21 && b[1]===0x3e && b[2]===0x5c,2500);approved=response[3]===1;}catch{/* bounded retry with the same ephemeral app key */}if(!approved)await new Promise(resolve=>setTimeout(resolve,Math.max(0,1000-(Date.now()-at))));approved ||= powerApproved;}
  if(!approved)throw new VehicleApprovalRequiredError('Turn on the headlight. Velunivo will reconnect and retry automatically.');
  ctx.phase('Headlight approval received. Completing authentication…');let authenticated=false;for(let retry=0;retry<3 && !authenticated;retry++){try{await exchange(crypto.encrypt(Uint8Array.from([0x3e,0x21,0x5d,0,...serial])),b=>b[0]===0x21 && b[1]===0x3e && b[2]===0x5d && b[3]===1,2500);authenticated=true;}catch{/* bounded retry */}}
  if(!authenticated)throw new Error('This Bluetooth firmware uses unsupported authentication. GPS navigation remains available.');
 }
 const serialText=String.fromCharCode(...serial).replace(/\0/g,'');if(!/^[\x20-\x7e]{6,14}$/.test(serialText))throw new Error('The vehicle identity could not be verified.');
 ctx.phase('Verifying real vehicle telemetry…');const first=await read(0x20,0xb4,16).catch(()=>{throw new Error('Bluetooth authentication completed, but the controller telemetry did not respond. Try again; this firmware may use unsupported telemetry registers.');});const verified=decodeRead(0x23,0xb4,first);if(Number(verified.fields.batteryPercent?.value)>100 || Number(verified.fields.speed?.value)<0 || Number(verified.fields.speed?.value)>55)throw new Error('Vehicle returned unsupported telemetry registers.');ctx.emit(verified);
 let firmware:string|undefined;try{const v=await read(0x20,0x1a,2);firmware=`0x${(v[0]+v[1]*256).toString(16)}`;}catch{/* optional identity register */}
 const unavailable=new Map<number,number>();let tick=0;
 async function cycle(){if(closed)return;try{const request=reads[tick++%reads.length];if(Date.now()-(unavailable.get(request.reg) ?? 0)>=60000){try{const data=await read(request.target,request.reg,request.size);ctx.emit(decodeRead(request.target===0x20?0x23:0x25,request.reg,data));if(request.reg===0xb4)failures=0;}catch{if(request.reg!==0xb4)unavailable.set(request.reg,Date.now());else if(++failures>=3){await link.disconnect();return;}}}if(tick%10===0){const signal=await link.readRSSI();if(signal!==null)ctx.emit({fields:{signal:{value:signal,timestamp:Date.now(),source:'vehicle',unit:'dBm'}}});}}catch{/* disconnection is owned by bridge */}if(!closed)poll=setTimeout(()=>void cycle(),350);}
 poll=setTimeout(()=>void cycle(),350);
 return {identity:{serial:serialText,firmware,model:'Xiaomi M365 family'},capabilities,close} satisfies ProtocolSession;
 }catch(e){await close();throw e;}
 }};
