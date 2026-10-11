// Independent implementation of published Mi FE95 protocol facts. References: docs/BLUETOOTH.md.
import {p256} from '@noble/curves/nist.js';
import {ecb} from '@noble/ciphers/aes.js';
import {hkdf} from '@noble/hashes/hkdf.js';
import {hmac} from '@noble/hashes/hmac.js';
import {sha256} from '@noble/hashes/sha2.js';
import {equalBytes} from '@noble/ciphers/utils.js';
import {bytesToHex,hexToBytes,concatBytes} from '@noble/hashes/utils.js';
import {BLELink,VehicleProtocolPlugin,SavedPairingRejectedError} from '../types';
import {VehicleApprovalRequiredError} from '../approvalRetry';
export const MI='0000fe95-0000-1000-8000-00805f9b34fb',CONTROL='00000010-0000-1000-8000-00805f9b34fb',DATA='00000019-0000-1000-8000-00805f9b34fb';
const text=(s:string)=>Uint8Array.from([...s].map(c=>c.charCodeAt(0)));
const ready=Uint8Array.of(0,0,1,1),ack=Uint8Array.of(0,0,1,0);
/** RFC 3610 CCM: 12-byte nonce, 4-byte tag; authentication failures never yield plaintext. */
export function ccmEncrypt(key:Uint8Array,nonce:Uint8Array,plain:Uint8Array,aad=new Uint8Array(0)){
 if(nonce.length!==12 || plain.length>0xffffff || aad.length>=0xff00)throw new Error('Unsupported CCM size');
 const block=(b:Uint8Array)=>ecb(key,{disablePadding:true}).encrypt(b);
 const b0=new Uint8Array(16);b0[0]=(aad.length?64:0)|8|2;b0.set(nonce,1);b0[13]=plain.length>>>16;b0[14]=plain.length>>>8;b0[15]=plain.length;
 let mac=block(b0);const absorb=(bytes:Uint8Array)=>{for(let i=0;i<bytes.length;i+=16){const b=new Uint8Array(16);b.set(bytes.slice(i,i+16));for(let j=0;j<16;j++)b[j]^=mac[j];mac=block(b);}};
 if(aad.length)absorb(concatBytes(Uint8Array.of(aad.length>>>8,aad.length&255),aad));absorb(plain);
 const counter=(n:number)=>{const b=new Uint8Array(16);b[0]=2;b.set(nonce,1);b[13]=n>>>16;b[14]=n>>>8;b[15]=n;return block(b);};
 const out=new Uint8Array(plain.length+4);for(let i=0;i<plain.length;i+=16){const s=counter(1+i/16);for(let j=0;j<16 && i+j<plain.length;j++)out[i+j]=plain[i+j]^s[j];}const zero=counter(0);for(let j=0;j<4;j++)out[plain.length+j]=mac[j]^zero[j];return out;
}
export function ccmDecrypt(key:Uint8Array,nonce:Uint8Array,wire:Uint8Array){
 if(wire.length<4)throw new Error('Truncated CCM');const plain=new Uint8Array(wire.length-4);
 for(let i=0;i<plain.length;i+=16){const b=new Uint8Array(16),n=1+i/16;b[0]=2;b.set(nonce,1);b[13]=n>>>16;b[14]=n>>>8;b[15]=n;const s=ecb(key,{disablePadding:true}).encrypt(b);for(let j=0;j<16 && i+j<plain.length;j++)plain[i+j]=wire[i+j]^s[j];}
 if(!equalBytes(ccmEncrypt(key,nonce,plain),wire))throw new Error('Vehicle packet authentication failed');return plain;
}
type Context=Parameters<VehicleProtocolPlugin['open']>[1];
type Keys={app:Uint8Array;device:Uint8Array;appIV:Uint8Array;deviceIV:Uint8Array};
/** Notifications are queued before writes, including immediate responses and back-to-back parcels. */
class Channel {
 private queue:Uint8Array[]=[];private waiter?:{resolve:(b:Uint8Array)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>};private stops:(()=>void)[]=[];private closed=false;
 constructor(private link:BLELink,private signal?:AbortSignal){for(const c of [CONTROL,DATA])this.stops.push(link.monitor(MI,c,b=>{if(this.closed)return;if(this.waiter){const w=this.waiter;this.waiter=undefined;clearTimeout(w.timer);w.resolve(b);}else this.queue.push(b);},e=>this.fail(e)));signal?.addEventListener('abort',this.cancel,{once:true});}
 private cancel=()=>this.fail(new Error('Connection cancelled'));
 private fail(e:Error){if(this.waiter){clearTimeout(this.waiter.timer);this.waiter.reject(e);this.waiter=undefined;}}
 next(){if(this.closed || this.signal?.aborted)return Promise.reject(new Error('Connection cancelled'));const b=this.queue.shift();if(b)return Promise.resolve(b);return new Promise<Uint8Array>((resolve,reject)=>{const timer=setTimeout(()=>{this.waiter=undefined;reject(new Error('Mi authentication response timed out'));},4000);this.waiter={resolve,reject,timer};});}
 write(c:string,b:Uint8Array){return this.link.write(MI,c,b);}
 async expect(bytes:Uint8Array){if(!equalBytes(await this.next(),bytes))throw new Error('Unexpected Mi authentication response');}
 async receive(){const header=await this.next();if(header.length!==6 || header[0]!==0 || header[1]!==0)throw new Error('Invalid Mi parcel header');const count=header[4]+256*header[5];if(count<1 || count>32)throw new Error('Unsupported Mi parcel size');await this.write(DATA,ready);const chunks:Uint8Array[]=[];for(let i=1;i<=count;i++){const b=await this.next();if(b.length<3 || b.length>20 || b[0]+256*b[1]!==i)throw new Error('Invalid Mi parcel sequence');chunks.push(b.slice(2));}await this.write(DATA,ack);return concatBytes(...chunks);}
 async send(kind:number,bytes:Uint8Array){await this.write(DATA,Uint8Array.of(0,0,0,kind,Math.ceil(bytes.length/18),0));await this.expect(ready);for(let i=0;i<bytes.length;i+=18)await this.write(DATA,concatBytes(Uint8Array.of(1+i/18,0),bytes.slice(i,i+18)));await this.expect(ack);}
 close(){this.closed=true;this.signal?.removeEventListener('abort',this.cancel);for(const stop of this.stops)stop();this.fail(new Error('Mi authentication closed'));this.queue=[];}
}
export async function authenticateMi(link:BLELink,ctx:Context):Promise<MiUART>{
 const channel=new Channel(link,ctx.signal);let token:Uint8Array|undefined;
 try{
  const saved=ctx.credentials?.miToken;if(saved && /^[0-9a-f]{24}$/i.test(saved))token=hexToBytes(saved);
  if(!token){
   ctx.phase('Registering with Xiaomi Bluetooth…');await channel.write(CONTROL,Uint8Array.of(0xa2,0,0,0));const info=await channel.receive();if(info.length!==24)throw new Error('Unsupported Xiaomi device identity');
   let privateKey:Uint8Array;do{privateKey=ctx.random(32);}while(!p256.utils.isValidSecretKey(privateKey));
   const publicKey=p256.getPublicKey(privateKey,false).slice(1);await channel.write(CONTROL,Uint8Array.of(0x15,0,0,0));
   try{await channel.send(3,publicKey);}catch(e){if(ctx.signal?.aborted)throw e;throw new VehicleApprovalRequiredError('Toggle the headlight once while disconnected. Velunivo will reconnect automatically.');}
   const remote=await channel.receive();if(remote.length!==64)throw new Error('Invalid Xiaomi public key');const secret=p256.getSharedSecret(privateKey,concatBytes(Uint8Array.of(4),remote),false).slice(1,33);privateKey.fill(0);
   const derived=hkdf(sha256,secret,undefined,text('mible-setup-info'),64);token=derived.slice(0,12);
   const did=ccmEncrypt(derived.slice(28,44),Uint8Array.from({length:12},(_,i)=>16+i),info.slice(4),text('devID'));await channel.send(0,did);await channel.write(CONTROL,Uint8Array.of(0x13,0,0,0));
   const response=await channel.next();if(!equalBytes(response,Uint8Array.of(0x11,0,0,0)))throw new VehicleApprovalRequiredError('Toggle the headlight once while disconnected. Velunivo will reconnect automatically.');
   if(ctx.credentials)ctx.credentials.miToken=bytesToHex(token);
  }
  ctx.phase('Authenticating with saved Xiaomi pairing…');const random=ctx.random(16);await channel.write(CONTROL,Uint8Array.of(0x24,0,0,0));await channel.send(0x0b,random);const remote=await channel.receive(),proof=await channel.receive();if(remote.length!==16 || proof.length!==32)throw new Error('Invalid Xiaomi login response');
  const salt=concatBytes(random,remote),derived=hkdf(sha256,token,salt,text('mible-login-info'),64);const keys:Keys={device:derived.slice(0,16),app:derived.slice(16,32),deviceIV:derived.slice(32,36),appIV:derived.slice(36,40)};
  if(!equalBytes(proof,hmac(sha256,keys.device,concatBytes(remote,random))))throw new SavedPairingRejectedError('The vehicle rejected this saved connection. Pairing is still saved; automatic retries are paused. Close other scooter connections and try Reconnect.');
  await channel.send(0x0a,hmac(sha256,keys.app,salt));await channel.expect(Uint8Array.of(0x21,0,0,0));return new MiUART(keys,ctx.random);
 }finally{channel.close();}
}
export class MiUART {
 private tx=0;private rx=-1;
 constructor(private keys:Keys,private random:(n:number)=>Uint8Array){}
 private nonce(iv:Uint8Array,counter:number){const n=new Uint8Array(12);n.set(iv);new DataView(n.buffer).setUint32(8,counter,true);return n;}
 encrypt(body:Uint8Array){if(this.tx>65535)throw new Error('Xiaomi session counter exhausted; reconnect');const n=this.tx++,ct=ccmEncrypt(this.keys.app,this.nonce(this.keys.appIV,n),concatBytes(body,this.random(4)));const data=concatBytes(Uint8Array.of(body.length-1,n&255,n>>>8),ct),crc=(data.reduce((s,b)=>s+b,0)^65535)&65535;return concatBytes(Uint8Array.of(0x55,0xab),data,Uint8Array.of(crc&255,crc>>>8));}
 decrypt(wire:Uint8Array){const data=wire.slice(2,-2),crc=(data.reduce((s,b)=>s+b,0)^65535)&65535;if(wire[0]!==0x55 || wire[1]!==0xab || wire.length!==wire[2]+16 || wire.at(-2)!==(crc&255) || wire.at(-1)!==(crc>>>8))throw new Error('Invalid Xiaomi UART frame');const n=wire[3]+256*wire[4];if(n<=this.rx)throw new Error('Replayed Xiaomi packet');const plain=ccmDecrypt(this.keys.device,this.nonce(this.keys.deviceIV,n),wire.slice(5,-2));this.rx=n;return plain.slice(0,-4);}
}
