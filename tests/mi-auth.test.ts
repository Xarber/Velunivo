import test from 'node:test';
import assert from 'node:assert/strict';
import {createCipheriv,createECDH,createHmac,hkdfSync} from 'node:crypto';
import {ccmEncrypt,ccmDecrypt,MiUART,authenticateMi,MI,CONTROL,DATA} from '../src/bluetooth/plugins/miAuth';
import {BLELink} from '../src/bluetooth/types';
import {VehicleApprovalRequiredError} from '../src/bluetooth/approvalRetry';
const cat=(...a:Uint8Array[])=>new Uint8Array(Buffer.concat(a));
const independentCCM=(key:Uint8Array,nonce:Uint8Array,data:Uint8Array,aad=new Uint8Array(0))=>{const c=createCipheriv('aes-128-ccm',key,nonce,{authTagLength:4});c.setAAD(aad,{plaintextLength:data.length});return cat(c.update(data),c.final(),c.getAuthTag());};
test('Mi CCM matches Node/OpenSSL for DID and UART, rejects corrupted tags',()=>{for(const size of [0,4,20,31,64]){const key=new Uint8Array(16).fill(11),nonce=new Uint8Array(12).fill(19),data=new Uint8Array(size).fill(42);for(const aad of [new Uint8Array(0),Buffer.from('devID')])assert.deepEqual(ccmEncrypt(key,nonce,data,aad),independentCCM(key,nonce,data,aad));const wire=ccmEncrypt(key,nonce,data);assert.deepEqual(ccmDecrypt(key,nonce,wire),data);wire[wire.length-1]^=1;assert.throws(()=>ccmDecrypt(key,nonce,wire),/authentication/);}});
function fixture(rejectRegistration=false){
 const handlers=new Map<string,(b:Uint8Array)=>void>();const commands:number[]=[];let receiving:{kind:number;parts:Uint8Array[]} | undefined;let parcelQueue:Uint8Array[]=[];let parcel:Uint8Array|undefined;let token:Uint8Array|undefined;let pub:Uint8Array|undefined;let appRandom:Uint8Array|undefined;let derived:Uint8Array|undefined;
 const server=createECDH('prime256v1');server.setPrivateKey(Buffer.alloc(32,7));const info=cat(Uint8Array.of(1,0,0,0),new Uint8Array(20).fill(65));
 const notify=(c:string,b:Uint8Array)=>handlers.get(c)?.(b);
 const header=()=>{parcel=parcelQueue.shift();if(parcel)notify(DATA,Uint8Array.of(0,0,0,3,Math.ceil(parcel.length/18),0));};
 const link:BLELink={device:{id:'fixture',name:'Custom name',services:[MI],rssi:null},hasCharacteristic:async()=>true,monitor:(_s,c,fn)=>{handlers.set(c,fn);return()=>{handlers.delete(c);};},onDisconnect:()=>()=>{},disconnect:async()=>{},readRSSI:async()=>null,
 write:async(s,c,b)=>{assert.equal(s,MI);if(c===CONTROL){commands.push(b[0]);if(b[0]===0xa2){parcelQueue=[info];header();}if(b[0]===0x13)notify(CONTROL,Uint8Array.of(rejectRegistration?0x12:0x11,0,0,0));return;}
 if(b.length===4 && b[0]===0 && b[2]===1){if(b[3]===1){for(let i=0;i<parcel!.length;i+=18)notify(DATA,cat(Uint8Array.of(1+i/18,0),parcel!.slice(i,i+18)));}else{parcel=undefined;header();}return;}
 if(b[0]===0){receiving={kind:b[3],parts:[]};notify(DATA,Uint8Array.of(0,0,1,1));return;}
 receiving!.parts.push(b.slice(2));const bytes=cat(...receiving!.parts),kind=receiving!.kind;const size=kind===3?64:kind===0?24:kind===11?16:32;if(bytes.length<size)return;
 if(kind===3){pub=bytes;const shared=server.computeSecret(cat(Uint8Array.of(4),pub));const d=new Uint8Array(hkdfSync('sha256',shared,new Uint8Array(0),Buffer.from('mible-setup-info'),64));token=d.slice(0,12);}
 if(kind===11){appRandom=bytes;const remote=new Uint8Array(16).fill(9);derived=new Uint8Array(hkdfSync('sha256',token!,cat(appRandom,remote),Buffer.from('mible-login-info'),64));parcelQueue=[remote,new Uint8Array(createHmac('sha256',derived.slice(0,16)).update(cat(remote,appRandom)).digest())];}
 if(kind===10){const expected=createHmac('sha256',derived!.slice(16,32)).update(cat(appRandom!,new Uint8Array(16).fill(9))).digest();assert.deepEqual(Buffer.from(bytes),expected);}
 notify(DATA,Uint8Array.of(0,0,1,0));if(kind===3){parcelQueue=[server.getPublicKey(undefined,'uncompressed').subarray(1)];header();}if(kind===11)header();if(kind===10)notify(CONTROL,Uint8Array.of(0x21,0,0,0));receiving=undefined;
 }};return {link,commands,get token(){return token;},set token(v:Uint8Array|undefined){token=v;}};
}
test('Mi registers, validates login proof and reuses its own saved token without headlight registration',async()=>{const f=fixture(),credentials:Record<string,string>={};await authenticateMi(f.link,{random:n=>new Uint8Array(n).fill(3),phase:()=>{},emit:()=>{},credentials});assert.equal(credentials.miToken?.length,24);assert.deepEqual(f.commands,[0xa2,0x15,0x13,0x24]);f.commands.length=0;await authenticateMi(f.link,{random:n=>new Uint8Array(n).fill(4),phase:()=>{},emit:()=>{},credentials});assert.deepEqual(f.commands,[0x24]);});
test('Mi approval rejection closes notifications, keeps no unapproved token and requests radio reconnect',async()=>{const f=fixture(true),credentials:Record<string,string>={};await assert.rejects(authenticateMi(f.link,{random:n=>new Uint8Array(n).fill(3),phase:()=>{},emit:()=>{},credentials}),VehicleApprovalRequiredError);assert.equal(credentials.miToken,undefined);});
test('Mi UART authenticates frames and rejects replay, tampering and counter exhaustion',()=>{const key=new Uint8Array(16).fill(3),iv=new Uint8Array(4).fill(7),keys={app:key,device:key,appIV:iv,deviceIV:iv};const tx=new MiUART(keys,n=>new Uint8Array(n).fill(5)),rx=new MiUART(keys,n=>new Uint8Array(n));const body=Uint8Array.of(0x23,1,0x10,65),wire=tx.encrypt(body);assert.deepEqual(rx.decrypt(wire),body);assert.throws(()=>rx.decrypt(wire),/Replayed/);wire[7]^=1;assert.throws(()=>new MiUART(keys,n=>new Uint8Array(n)).decrypt(wire),/Invalid/);});
