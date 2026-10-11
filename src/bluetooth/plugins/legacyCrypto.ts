// Independent implementation of the documented first-generation Ninebot wire protocol.
// No upstream source is vendored. See docs/BLUETOOTH.md for provenance and limitations.
import { ecb } from '@noble/ciphers/aes.js';
import { sha1 } from '@noble/hashes/legacy.js';
const seed=Uint8Array.from([0x97,0xcf,0xb8,2,0x84,0x41,0x43,0xde,0x56,0,0x2b,0x3b,0x34,0x78,0x0a,0x5d]);
const join=(...a:Uint8Array[])=>Uint8Array.from(a.flatMap(x=>Array.from(x)));
const same=(a:Uint8Array,b:Uint8Array)=>a.length===b.length && a.reduce((v,x,i)=>v|(x^b[i]),0)===0;
export class LegacyCrypto {
 private name:Uint8Array;private key:Uint8Array;private nonce=new Uint8Array(16);private app=new Uint8Array(16);private counter=0;private received=-1;
 constructor(name:string){const bytes=Uint8Array.from(Array.from(name),c=>c.charCodeAt(0));if(bytes.length>16)throw new Error('Unsupported encrypted Bluetooth name');this.name=new Uint8Array(16);this.name.set(bytes);this.key=sha1(join(this.name,seed)).slice(0,16);}
 private block(b:Uint8Array){return ecb(this.key,{disablePadding:true}).encrypt(b);}
 private crypt(payload:Uint8Array,counter:number){const output=new Uint8Array(payload.length);for(let i=0;i<payload.length;i+=16){const b=counter===0?seed:new Uint8Array(16);if(counter){b[0]=1;new DataView(b.buffer).setUint32(1,counter);b.set(this.nonce.slice(0,8),5);b[15]=1+i/16;}const mask=this.block(b);for(let j=0;j<Math.min(16,payload.length-i);j++)output[i+j]=payload[i+j]^mask[j];}return output;}
 private mac(data:Uint8Array,counter:number){if(counter===0){const crc=data.slice(3).reduce((n,b)=>n+b,0)^0xffff;return Uint8Array.from([0,0,crc&255,crc>>8&255]);}const b=new Uint8Array(16);b[0]=89;new DataView(b.buffer).setUint32(1,counter);b.set(this.nonce.slice(0,8),5);b[15]=data.length-3;let state=this.block(b);const blocks=[data.slice(0,3)];for(let i=3;i<data.length;i+=16)blocks.push(data.slice(i,i+16));for(const chunk of blocks){const p=new Uint8Array(16);p.set(chunk);state=this.block(p.map((v,i)=>v^state[i]));}b[0]=1;b[15]=0;const mask=this.block(b);return state.map((v,i)=>v^mask[i]).slice(0,4);}
 encrypt(body:Uint8Array){const frame=join(Uint8Array.from([0x5a,0xa5,body.length-4]),body),counter=this.counter===0?0:++this.counter;const wire=join(frame.slice(0,3),this.crypt(body,counter),this.mac(frame,counter),Uint8Array.from([counter>>8&255,counter&255]));if(this.counter===0)this.counter=1;if(body[0]===0x3e && body[1]===0x21 && body[2]===0x5c && body[3]===0 && body.length===20)this.app=body.slice(4);return wire;}
 decrypt(wire:Uint8Array){if(wire.length!==wire[2]+13 || wire[0]!==0x5a || wire[1]!==0xa5)throw new Error('Malformed encrypted frame');const low=wire[wire.length-2]*256+wire[wire.length-1];let counter=(this.counter&0xffff0000)+low;if((this.counter&0x8000) && !(low&0x8000))counter+=65536;if(counter<=this.received)throw new Error('Replayed telemetry frame');const body=this.crypt(wire.slice(3,-6),counter),frame=join(wire.slice(0,3),body);if(!same(this.mac(frame,counter),wire.slice(-6,-2)))throw new Error('Bluetooth authentication checksum failed');this.received=counter;this.counter=Math.max(this.counter,counter);
 if(body[0]===0x21 && body[1]===0x3e && body[2]===0x5b && body.length===34){this.nonce=body.slice(4,20);this.key=sha1(join(this.name,this.nonce)).slice(0,16);}
 if(body[0]===0x21 && body[1]===0x3e && body[2]===0x5c && body[3]===1)this.key=sha1(join(this.app,this.nonce)).slice(0,16);return body;}
}
