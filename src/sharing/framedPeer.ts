import type {Peer,DataConnection,PeerConnectOption} from 'peerjs';import {encodePeerFrames,peerFrameReader} from './peerFrames';
const decorated=new WeakSet<DataConnection>();
export function frameConnection(c:DataConnection){if(decorated.has(c))return c;decorated.add(c);const send=c.send.bind(c),on=c.on.bind(c) as (event:string,fn:(value:unknown)=>void)=>unknown;let sequence=0;
 c.send=(value:unknown)=>{if(c.serialization!=='raw'){send(value);return;}for(const frame of encodePeerFrames(value,`${Date.now()}-${++sequence}`))send(frame);};
 c.on=((event:string,listener:(value:unknown)=>void)=>{const read=peerFrameReader();return on(event,event==='data'?raw=>{for(const value of read(raw))listener(value);}:listener);}) as typeof c.on;return c;}
export function framedPeer(PeerClass:typeof Peer):typeof Peer{return class extends PeerClass {constructor(...args:ConstructorParameters<typeof Peer>){super(...args);this.on('connection',c=>frameConnection(c));}connect(id:string,options?:PeerConnectOption){return frameConnection(super.connect(id,{...options,serialization:'raw'}));}} as typeof Peer;}
