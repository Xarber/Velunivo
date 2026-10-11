import test from 'node:test';
import assert from 'node:assert/strict';
import {PluginRegistry} from '../src/bluetooth/registry';
import {XiaomiM365Plugin} from '../src/bluetooth/plugins/XiaomiM365Plugin';
import {SimulatorPlugin,simulatorDevice} from '../src/bluetooth/plugins/SimulatorPlugin';
import {NUS,TX,RX,readPacket,PacketStream,decodeRead,validPlain} from '../src/bluetooth/plugins/m365Packets';
import {normalize,freshReading,batteryColor} from '../src/bluetooth/telemetry';
import {LegacyCrypto} from '../src/bluetooth/plugins/legacyCrypto';
import {BluetoothVehicleBridge} from '../src/bluetooth/bridge';
import {Association,BLEDeviceInfo,BLELink,BLETransport,BridgeSnapshot,Reading} from '../src/bluetooth/types';
import {restoreBluetoothPreferences,metricVisible} from '../src/bluetooth/preferences';
import {sampleBluetooth,updateTripBluetooth,automaticBatteryUsage} from '../src/bluetooth/tripTelemetry';
import {pendingBatteryRide} from '../src/core/batteryLearning';
const device:BLEDeviceInfo={id:'real',name:'MIScooter1234',rssi:-50,services:[NUS],manufacturerData:Uint8Array.from([0x4e,0x42,0x20]),connectable:true};
const reading=(value:number,timestamp=1000):Reading=>({value,timestamp,unit:'%',source:'vehicle'});
test('registry strictly filters vehicle type, uncertain identities and developer simulations',()=>{
 const r=new PluginRegistry().register(XiaomiM365Plugin).register(SimulatorPlugin);assert.throws(()=>r.register(XiaomiM365Plugin));assert.equal(r.forType('electric_bike').length,0);assert.equal(r.forType('electric_bike',true).length,1);
 assert.equal(r.identify(device,'electric_scooter')?.plugin.id,XiaomiM365Plugin.id);assert.equal(r.identify(device,'electric_bike'),null);
 assert.equal(r.identify({...device,services:[]},'electric_scooter'),null);assert.equal(r.identify({...device,manufacturerData:undefined},'electric_scooter'),null);assert.equal(r.identify({...device,name:'My headphones'},'electric_scooter'),null);assert.equal(r.identify({...device,manufacturerData:Uint8Array.from([1,2,3])},'electric_scooter'),null);
 assert.equal(r.identify(simulatorDevice,'electric_scooter'),null);assert.equal(r.identify(simulatorDevice,'electric_scooter',true)?.plugin.simulator,true);
});
test('normalization keeps partial timestamps, rejects unsupported/invalid data, and expires actual telemetry',()=>{
 const initial=normalize({fields:{batteryPercent:reading(45)}},['batteryPercent'],{},1000);
 const partial=normalize({fields:{speed:{value:5,timestamp:2000,unit:'m/s',source:'vehicle'}}},['batteryPercent','speed'],initial,2000);assert.equal(partial.batteryPercent,initial.batteryPercent);
 const corrupt=normalize({fields:{batteryPercent:reading(101,3000),voltage:{value:NaN,timestamp:3000,unit:'V',source:'vehicle'}}},['batteryPercent'],partial,3000);assert.equal(corrupt.batteryPercent!.value,45);assert.equal(corrupt.voltage,undefined);
 assert.equal(normalize({fields:{batteryPercent:reading(2,999)}},['batteryPercent'],initial,2000).batteryPercent!.value,45);
 assert.equal(freshReading(initial,'batteryPercent',31001),undefined);assert.equal(freshReading(initial,'batteryPercent',999)?.value,45);assert.equal(freshReading(initial,'batteryPercent',-2000),undefined);assert.equal(freshReading(initial,'batteryPercent',1000)?.value,45);assert.equal(freshReading({batteryPercent:{...reading(10),source:'simulator'}},'batteryPercent',1000),undefined);
 assert.equal(batteryColor(0),'#D75451');assert.equal(batteryColor(19),'#D75451');assert.equal(batteryColor(20),'#E49235');assert.equal(batteryColor(39),'#E49235');assert.equal(batteryColor(40),undefined);
});
test('known M365 read request, packet fragmentation/checksums and SI decoding',()=>{
 assert.equal(Buffer.from(readPacket(0x20,0x10,14)).toString('hex'),'55aa032001100ebdff');assert.throws(()=>readPacket(0x20,0x7c,2));
 const stream=new PacketStream(),request=readPacket(0x20,0x10,14);assert.equal(stream.feed(request.slice(0,4)).length,0);assert.deepEqual(stream.feed(request.slice(4)),[request]);assert.ok(validPlain(request));const bad=request.slice();bad[4]^=1;assert.equal(validPlain(bad),false);
 const data=new Uint8Array(16),v=new DataView(data.buffer);v.setUint16(0,76,true);v.setUint16(2,25000,true);v.setUint32(6,123456,true);v.setUint16(14,320,true);const decoded=decodeRead(0x23,0xb4,data,1000);assert.equal(decoded.fields.speed!.value,25000/3600);assert.equal(decoded.fields.odometer!.value,123456);assert.equal(decoded.fields.controllerTemperature,undefined);assert.equal(decoded.extensions!.frameTemperature.value,32);
 const bms=Uint8Array.from([0,0,76,0,0x38,0xff,0x40,0x10,49,50]),battery=decodeRead(0x25,0x31,bms,1000);assert.equal(battery.fields.current!.value,-2);assert.equal(battery.fields.voltage!.value,41.6);assert.equal(battery.fields.batteryTemperature!.value,30);assert.equal(battery.fields.power!.source,'calculated');assert.equal(battery.fields.charging,undefined);assert.deepEqual(decodeRead(0x25,0x99,bms).fields,{});
});
test('encrypted framing authenticates first frames and rejects tampering/replays',()=>{
 const tx=new LegacyCrypto('MIScooter1234'),rx=new LegacyCrypto('MIScooter1234');const data=Uint8Array.from([0x3e,0x21,0x5b,0]),wire=tx.encrypt(data);assert.equal(wire.length,13);assert.equal(wire[2],0);assert.deepEqual(rx.decrypt(wire),data);assert.throws(()=>rx.decrypt(wire),/Replayed/);
 const invalid=wire.slice();invalid[3]^=1;assert.throws(()=>new LegacyCrypto('MIScooter1234').decrypt(invalid),/checksum/);
});
const registry=()=>new PluginRegistry().register(XiaomiM365Plugin).register(SimulatorPlugin);
function fixture(){let receiver:((bytes:Uint8Array)=>void)|undefined,disconnected:((e?:Error)=>void)|undefined,connects=0,disconnects=0;let records:Association[]=[];
 const respond=(reg:number,data:Uint8Array)=>{const body=[data.length+2,0x23,1,reg,...data],crc=body.reduce((n,b)=>n+b,0)^0xffff;receiver?.(Uint8Array.from([0x55,0xaa,...body,crc&255,crc>>8&255]));};
 const link:BLELink={device,hasCharacteristic:async(s,c)=>s===NUS && [TX,RX].includes(c),monitor:(_s,_c,fn)=>{receiver=fn;return()=>{receiver=undefined;};},write:async(_s,_c,bytes)=>{assert.equal(bytes[4],1,'only read commands');const reg=bytes[5],size=bytes[6],data=new Uint8Array(size);if(reg===0x10)data.set(Buffer.from('12345/12345678'));if(reg===0xb4){new DataView(data.buffer).setUint16(0,60,true);new DataView(data.buffer).setUint16(2,18000,true);}respond(reg,data);},onDisconnect:fn=>{disconnected=fn;return()=>{disconnected=undefined;};},disconnect:async()=>{disconnects++;},readRSSI:async()=>-40};
 const transport:BLETransport={ready:async()=>{},observeState:()=>()=>{},scan:async(_s,fn)=>{fn(device);return()=>{};},connect:async()=>{connects++;return link;}};
 const bridge=new BluetoothVehicleBridge(registry(),transport,{load:async()=>records,save:async r=>{records=r;}},n=>new Uint8Array(n).fill(3));return {bridge,transport,link,get records(){return records;},get connects(){return connects;},get disconnects(){return disconnects;},lose:()=>disconnected?.(new Error('out of range'))};}
test('real read-only session verifies identity, persists association, shares leases and supports forgetting',async()=>{
 const f=fixture();await assert.rejects(f.bridge.pair('bike','electric_bike',device,XiaomiM365Plugin.id));assert.equal(f.connects,0);
 await f.bridge.pair('scooter','electric_scooter',device,XiaomiM365Plugin.id);assert.equal(f.bridge.getSnapshot().state,'connected');assert.equal(f.bridge.getSnapshot().fields.batteryPercent!.value,60);assert.equal(f.records.length,1);
 const release1=f.bridge.acquire('scooter'),release2=f.bridge.acquire('scooter');release1();assert.equal(f.bridge.getSnapshot().state,'connected');release2();await new Promise(r=>setTimeout(r,20));assert.equal(f.bridge.getSnapshot().state,'disconnected');
 await f.bridge.reconnect('scooter');assert.equal(f.connects,2);await f.bridge.forget('scooter');assert.equal(f.records.length,0);assert.equal(f.bridge.association('scooter'),undefined);
});
test('connection loss reconnects a live consumer without replacing its ride; manual disconnect stops retries',async()=>{
 const f=fixture();await f.bridge.pair('scooter','electric_scooter',device,XiaomiM365Plugin.id);const release=f.bridge.acquire('scooter');f.lose();await new Promise(r=>setTimeout(r,1150));assert.equal(f.bridge.getSnapshot().state,'connected');assert.equal(f.connects,2);await f.bridge.disconnect();await new Promise(r=>setTimeout(r,1050));assert.equal(f.connects,2);release();
});
test('simulator exercises bridge without permissions, physical transport or persisted fake association',async()=>{
 const f=fixture();await f.bridge.simulate('bike','electric_bike');assert.equal(f.connects,0);assert.equal(f.records.length,0);assert.equal(f.bridge.getSnapshot().simulated,true);assert.equal(f.bridge.getSnapshot().fields.speed!.source,'simulator');assert.equal(sampleBluetooth(f.bridge.getSnapshot(),'bike',Date.now())?.simulated,true);await f.bridge.disconnect();
});
test('trip telemetry associates SI readings, detects charging/inconsistency/gaps and suppresses duplicate prompts',()=>{
 const start=100000;const snapshot:BridgeSnapshot={state:'connected',message:'',pluginId:'xiaomi-m365-v1',vehicleId:'scooter',fields:{batteryPercent:reading(80,start)},extensions:{}};
 const first=sampleBluetooth(snapshot,'scooter',start)!;let summary=updateTripBluetooth(undefined,first,start);const last=sampleBluetooth({...snapshot,fields:{batteryPercent:reading(75,start+20000)}},'scooter',start+20000)!;summary=updateTripBluetooth(summary,last,start);assert.equal(automaticBatteryUsage(summary,start+20000),5);
 assert.equal(automaticBatteryUsage(updateTripBluetooth(summary,{...last,state:'disconnected'},start),start+20000),null);assert.equal(automaticBatteryUsage(updateTripBluetooth(summary,{...last,timestamp:start+22000,fields:{batteryPercent:reading(81,start+22000)}},start),start+22000),null);
 assert.equal(automaticBatteryUsage({...summary,chargedOrInconsistent:true},start+20000),null);assert.equal(automaticBatteryUsage(summary,start+60000),null);assert.equal(sampleBluetooth(snapshot,'other',start),undefined);
 const completed={id:'r',status:'finished',samples:2,batteryFeedback:'answered',batteryUsageSource:'bluetooth',batteryUsagePercent:5} as const;assert.equal(pendingBatteryRide([completed as never]),undefined);
});
test('visibility persists independently from collection and unsupported schema preserves defaults',()=>{
 const p=restoreBluetoothPreferences(JSON.stringify({schema:1,autoReconnect:false,collectTelemetry:true,visible:{batteryPercent:false,speed:true,voltage:'bad'}}));assert.equal(p.autoReconnect,false);assert.equal(p.collectTelemetry,true);assert.equal(metricVisible(p,'batteryPercent'),false);assert.equal(metricVisible(p,'voltage'),true);assert.equal(restoreBluetoothPreferences('{"schema":100}').autoReconnect,true);
});
// Independent fixture encoder uses Node/OpenSSL, rather than the app's noble primitives.
// Protocol facts only: no manufacturer/upstream implementation is imported into tests.
import {createCipheriv,createHash} from 'node:crypto';
const seed=Buffer.from('97cfb802844143de56002b3b34780a5d','hex');
const derive=(a:Uint8Array,b:Uint8Array)=>createHash('sha1').update(a).update(b).digest().subarray(0,16);
const aes=(key:Uint8Array,b:Uint8Array)=>{const cipher=createCipheriv('aes-128-ecb',key,null);cipher.setAutoPadding(false);return Buffer.concat([cipher.update(b),cipher.final()]);};
function referenceCrypt(data:Uint8Array,key:Uint8Array,nonce:Uint8Array,count:number){const out=Buffer.alloc(data.length);for(let offset=0;offset<data.length;offset+=16){const iv=Buffer.alloc(16);if(count){iv[0]=1;iv.writeUInt32BE(count,1);Buffer.from(nonce).copy(iv,5,0,8);iv[15]=1+offset/16;}else seed.copy(iv);const mask=aes(key,iv);for(let i=0;i<Math.min(16,data.length-offset);i++)out[offset+i]=data[offset+i]^mask[i];}return out;}
function referenceFrame(body:Uint8Array,key:Uint8Array,nonce:Uint8Array,count:number){const header=Buffer.from([0x5a,0xa5,body.length-4]),frame=Buffer.concat([header,body]);let tag:Buffer;if(!count){const crc=body.reduce((sum,n)=>sum+n,0)^65535;tag=Buffer.from([0,0,crc&255,crc>>>8&255]);}else{const iv=Buffer.alloc(16);iv[0]=0x59;iv.writeUInt32BE(count,1);Buffer.from(nonce).copy(iv,5,0,8);iv[15]=body.length;let block=aes(key,iv);const chunks=[header];for(let i=0;i<body.length;i+=16)chunks.push(Buffer.from(body.slice(i,i+16)));for(const chunk of chunks){const input=Buffer.alloc(16);chunk.copy(input);for(let i=0;i<16;i++)input[i]^=block[i];block=aes(key,input);}iv[0]=1;iv[15]=0;const mask=aes(key,iv);tag=Buffer.from(block.map((n,i)=>n^mask[i])).subarray(0,4);}return Buffer.concat([header,referenceCrypt(body,key,nonce,count),tag,Buffer.from([count>>>8&255,count&255])]);}
test('encrypted power-button handshake and real register reads match independent OpenSSL fixtures',async()=>{
 const name=Buffer.alloc(16);Buffer.from(device.name!).copy(name);let key=derive(name,seed);const nonce=Buffer.from('00112233445566778899aabbccddeeff','hex'),serial=Buffer.from('12345/12345678');let receiver:((p:Uint8Array)=>void)|undefined,app:Uint8Array|undefined;const commands:number[]=[];
 const link:BLELink={device,hasCharacteristic:async()=>true,monitor:(_s,_c,fn)=>{receiver=fn;return()=>{receiver=undefined;};},onDisconnect:()=>()=>{},disconnect:async()=>{},readRSSI:async()=>-45,write:async(_s,_c,wire)=>{
  if(wire[0]===0x55)return;const count=wire.at(-2)!*256+wire.at(-1)!,body=referenceCrypt(wire.slice(3,-6),key,nonce,count);assert.deepEqual(Buffer.from(wire),referenceFrame(body,key,nonce,count),'app request MAC matches independent encoder');commands.push(body[2]);let response:Uint8Array;
  if(body[2]===0x5b){response=Uint8Array.from([0x21,0x3e,0x5b,0,...nonce,...serial]);receiver?.(referenceFrame(response,key,nonce,0));key=derive(name,nonce);return;}
  if(body[2]===0x5c){app=body.slice(4);response=Uint8Array.from([0x21,0x3e,0x5c,1]);receiver?.(referenceFrame(response,key,nonce,count+1));key=derive(app,nonce);return;}
  if(body[2]===0x5d){assert.deepEqual(body.subarray(4),serial);response=Uint8Array.from([0x21,0x3e,0x5d,1]);}
  else{assert.equal(body[2],1,'all non-authentication commands are reads');const data=Buffer.alloc(body[4]);if(body[3]===0xb4){data.writeUInt16LE(70);data.writeUInt16LE(21000,2);}response=Uint8Array.from([0x20,0x3e,1,body[3],...data]);}
  receiver?.(referenceFrame(response,key,nonce,count+1));
 }};const readings:unknown[]=[];const session=await XiaomiM365Plugin.open(link,{emit:r=>readings.push(r),phase:()=>{},random:n=>new Uint8Array(n).fill(7)});assert.ok(app);assert.equal(session.identity.serial,'12345/12345678');assert.deepEqual(commands,[0x5b,0x5c,0x5d,1,1]);assert.equal((readings[0] as {fields:{batteryPercent:Reading}}).fields.batteryPercent.value,70);await session.close();
});
test('permissions and unsupported services fail safely without a persisted association',async()=>{
 const f=fixture();f.transport.ready=async()=>{throw new Error('Bluetooth permission is denied');};await assert.rejects(f.bridge.discover('electric_scooter',()=>{}),/permission/);assert.equal(f.bridge.getSnapshot().state,'error');assert.equal(f.connects,0);assert.equal(f.records.length,0);
 const unsupported=fixture();unsupported.link.hasCharacteristic=async()=>false;await assert.rejects(unsupported.bridge.pair('scooter','electric_scooter',device,XiaomiM365Plugin.id),/service/);assert.equal(unsupported.bridge.getSnapshot().state,'error');assert.equal(unsupported.records.length,0);
 const simulated=fixture();simulated.transport.observeState=()=>{throw new Error('simulator must not start native Bluetooth');};await simulated.bridge.simulate('s','electric_scooter');await simulated.bridge.disconnect();
});

test('disabling automatic reconnection cancels an already queued retry',async()=>{
 const f=fixture();await f.bridge.pair('s','electric_scooter',device,XiaomiM365Plugin.id);const release=f.bridge.acquire('s');f.lose();await new Promise(r=>setTimeout(r,20));f.bridge.autoReconnect=false;await new Promise(r=>setTimeout(r,1100));assert.equal(f.connects,1);release();
});
import {createRideArchive} from '../src/core/rideArchive';
import {RecordedRide,RideSample} from '../src/core/recordings';
import {createVehicle} from '../src/core/vehicles';
test('Bluetooth timelines and automatic battery feedback survive archive restart alongside old records',async()=>{
 const values=new Map<string,string>(),storage={getItem:async(k:string)=>values.get(k)||null,setItem:async(k:string,v:string)=>{values.set(k,v);},multiGet:async(keys:string[])=>keys.map(k=>[k,values.get(k)||null] as const),multiSet:async(entries:[string,string][])=>{for(const [k,v] of entries)values.set(k,v);},multiRemove:async(keys:string[])=>{for(const k of keys)values.delete(k);}};
 const archive=createRideArchive(storage),vehicle=createVehicle('escooter','fixture');const ride:RecordedRide={id:'ble-trip',vehicle,name:'Start → Arrival',startLabel:'Start',endLabel:'Arrival',startedAt:1000,endedAt:22000,status:'finished',samples:1,chunks:1,meters:2000,preview:[],batteryFeedback:'answered',batteryUsageSource:'bluetooth',batteryUsagePercent:5,bluetooth:{schema:1,pluginId:'xiaomi-m365-v1',startBattery:80,endBattery:75,startAt:1000,endAt:22000,interruptions:0,interrupted:false,chargedOrInconsistent:false}};
 const sample:RideSample={fix:{coordinate:[0,0],accuracy:5,speed:5,timestamp:22000},compass:null,accelerometer:null,gyroscope:null,bluetooth:{vehicleId:vehicle.id,pluginId:'xiaomi-m365-v1',simulated:false,fields:{batteryPercent:reading(75,22000)},state:'connected',timestamp:22000}};
 await archive.persistRide(ride,[{index:0,samples:[sample]}]);await archive.persistRide({...ride,id:'old',bluetooth:undefined,batteryUsageSource:undefined,batteryUsagePercent:undefined,batteryFeedback:undefined,chunks:0},[]);
 await archive.persistRide({...ride,batteryFeedback:'pending',batteryUsageSource:undefined,batteryUsagePercent:undefined},[]);const reboot=createRideArchive(storage),saved=(await reboot.recordedRides()).find(r=>r.id==='ble-trip')!;assert.equal(saved.batteryUsageSource,'bluetooth');assert.equal(saved.batteryUsagePercent,5);assert.deepEqual(saved.bluetooth,ride.bluetooth);assert.deepEqual(await reboot.rideSamples(saved),[sample]);assert.equal((await reboot.recordedRides()).find(r=>r.id==='old')!.bluetooth,undefined);assert.equal(pendingBatteryRide(await reboot.recordedRides()),undefined);
});

test('connection cancellation stops in-flight protocol initialization and removes notifications',async()=>{
 const abort=new AbortController();let listening=false,writes=0;const link:BLELink={device,hasCharacteristic:async()=>true,monitor:()=>{listening=true;return()=>{listening=false;};},write:async()=>{writes++;abort.abort();},onDisconnect:()=>()=>{},disconnect:async()=>{},readRSSI:async()=>null};await assert.rejects(XiaomiM365Plugin.open(link,{signal:abort.signal,emit:()=>{},phase:()=>{},random:n=>new Uint8Array(n)}),/cancelled/);assert.equal(listening,false);assert.equal(writes,1);
});

import {canPairVehicle,dashboardReading,globalTelemetryMetrics,removeVehicleAndPairing} from '../src/bluetooth/policy';
test('public sharing vehicles reject real and simulated connections and old associations are removed',async()=>{
 const f=fixture();assert.equal(canPairVehicle('sharing-scooter'),false);await assert.rejects(f.bridge.pair('sharing-scooter','electric_scooter',device,XiaomiM365Plugin.id),/Public sharing/);await assert.rejects(f.bridge.simulate('sharing-scooter','electric_scooter'),/Public sharing/);assert.equal(f.connects,0);
 await f.bridge.pair('scooter','electric_scooter',device,XiaomiM365Plugin.id);f.records.push({...f.records[0],vehicleId:'sharing-scooter'});await f.bridge.initialize();assert.equal(f.bridge.association('sharing-scooter'),undefined);assert.equal(f.records.length,1);await f.bridge.forget('scooter');
});
test('vehicle deletion removes its persisted pairing, retains other vehicles and leaves history independent',async()=>{
 const f=fixture();await f.bridge.pair('scooter','electric_scooter',device,XiaomiM365Plugin.id);const garage={vehicles:[createVehicle('escooter','scooter'),createVehicle('ebike','other')],activeId:'scooter'};
 const next=await removeVehicleAndPairing(garage,'scooter',id=>f.bridge.forget(id));assert.equal(next.vehicles.length,1);assert.equal(next.activeId,'other');assert.equal(f.records.length,0);assert.equal(f.bridge.association('scooter'),undefined);assert.equal(f.bridge.getSnapshot().state,'disconnected');
 let forgets=0;assert.equal(await removeVehicleAndPairing(next,'other',async()=>{forgets++;}),next);assert.equal(forgets,0);await assert.rejects(removeVehicleAndPairing(garage,'scooter',async()=>{throw new Error('storage unavailable');}),/storage/);assert.equal(garage.vehicles.length,2);
 await f.bridge.pair('orphan','electric_scooter',device,XiaomiM365Plugin.id);await f.bridge.retainVehicles(['other','sharing-scooter']);assert.equal(f.records.length,0);assert.equal(f.bridge.association('orphan'),undefined);
});
test('simulator survives navigation/recording leases, populates dashboard readings and resumes the real connection when disabled',async()=>{
 const f=fixture();await f.bridge.pair('scooter','electric_scooter',device,XiaomiM365Plugin.id);await f.bridge.simulate('scooter','electric_scooter');const release=f.bridge.acquire('scooter');await new Promise(r=>setTimeout(r,10));assert.equal(f.connects,1);assert.equal(f.bridge.getSnapshot().simulated,true);assert.equal(dashboardReading(f.bridge.getSnapshot(),'scooter','batteryPercent',Date.now())?.value,76);assert.equal(dashboardReading(f.bridge.getSnapshot(),'scooter','speed',Date.now())?.source,'simulator');assert.equal(dashboardReading({...f.bridge.getSnapshot(),vehicleId:'sharing-scooter'},'sharing-scooter','batteryPercent',Date.now()),undefined);
 const sample=sampleBluetooth(f.bridge.getSnapshot(),'scooter',Date.now())!;assert.equal(sample.simulated,true);assert.equal(sample.fields.batteryPercent?.source,'simulator');const summary=updateTripBluetooth(undefined,sample,sample.timestamp);assert.equal(summary.simulated,true);assert.equal(automaticBatteryUsage({...summary,startBattery:80,endBattery:75,startAt:1,endAt:20001,chargedOrInconsistent:false},20001),null);
 await f.bridge.stopSimulation();assert.equal(f.bridge.getSnapshot().simulated,undefined);assert.equal(f.bridge.getSnapshot().state,'connected');assert.equal(f.connects,2);release();await f.bridge.disconnect();
});
test('Bluetooth display and simulation preferences are global and old preferences migrate safely',()=>{
 const fields=globalTelemetryMetrics(registry());assert.ok(fields.includes('batteryPercent'));assert.ok(fields.includes('speed'));assert.equal(fields.includes('charging'),false);assert.ok(globalTelemetryMetrics(registry(),true).includes('charging'));
 assert.equal(restoreBluetoothPreferences('{"schema":1,"autoReconnect":false}').simulateTelemetry,false);const preferences=restoreBluetoothPreferences(JSON.stringify({...restoreBluetoothPreferences(null),simulateTelemetry:true,visible:{batteryPercent:false}}));assert.equal(preferences.simulateTelemetry,true);assert.equal(metricVisible(preferences,'batteryPercent'),false);
});
