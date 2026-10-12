import {createViewerPresence} from './viewerPresence';
import type {Peer,DataConnection} from 'peerjs';
import {loadPeerConstructor} from './peerConstructor';

import {clientPeerId} from './peerIdentity';
import {peerOptions} from './peerOptions';
import { parseTripMessage, PIN_PATTERN, TripMessage } from './model';
export interface SessionEvents { status(s:string):void; message?(m:TripMessage):void; ready?():void; viewers?(count:number):void; recover?():void; }
export class PeerSession {
  private lastReceived=Date.now();
  private healthTimer?:ReturnType<typeof setInterval>;
  private presence=createViewerPresence();
  private viewerCount=-1;
  private presenceTimer?:ReturnType<typeof setInterval>;
  private reportViewers(){if(this.role!=='host')return;const count=this.presence.count();if(count!==this.viewerCount){this.viewerCount=count;this.events.viewers?.(count);}}
  private viewerKey(c:DataConnection){const id=c.metadata?.viewerId;return typeof id==='string' && /^velunivo-viewer-[a-f0-9]{32}$/.test(id)?id:c.peer || c;}
  private send(c:DataConnection,m:TripMessage){try{c.send(m);if(m.type==='progress'){this.presence.mark(this.viewerKey(c));this.reportViewers();}}catch{c.close();}}
  private connections = new Set<DataConnection>();
  private route:TripMessage | null=null;
  private progress:TripMessage | null=null;
  private closed=false;
  private lastSent=0;
  private timer:ReturnType<typeof setTimeout>;
  constructor(private peer:Peer,private role:'host'|'viewer',private pin:string,private events:SessionEvents,private viewerId?:string) {
    if(role==='host'){this.reportViewers();this.presenceTimer=setInterval(()=>this.reportViewers(),1000);}
    this.timer=setTimeout(()=>{events.status('Connection timed out. Retry when both devices are online.');this.failed();},20000);
    this.healthTimer=setInterval(()=>{if(this.peer.destroyed || (this.role==='viewer' && Date.now()-this.lastReceived>=30000))this.failed();},5000);
    peer.on('error',()=>{if(this.closed)return;events.status('Sharing connection unavailable. Retry when online.');this.failed();});
    peer.on('disconnected',()=>{if(this.closed)return;events.status('Signaling disconnected. Sharing may be interrupted.');this.reconnectSignaling();});
    peer.on('open',()=>{
      if(this.closed)return;clearTimeout(this.timer);
      if(role==='host'){clearTimeout(this.timer);events.status('Live trip sharing is on');events.ready?.();}
      else if(!this.connections.size)this.attach(peer.connect(`velunivo-${pin}`,{reliable:true,serialization:'json',metadata:{viewerId:this.viewerId}}));
    });
    if(role==='host')peer.on('connection',c=>{if(this.closed){c.close();return;}this.attach(c);});
    peer.on('call',call=>call.close()); // Never acquire or accept audio/video.
  }
  private attach(c:DataConnection) {
    if(this.role==='host'){for(const old of this.connections)if(this.viewerKey(old)===this.viewerKey(c)){this.connections.delete(old);old.close();}if(this.connections.size>=8){c.close();return;}}
    this.connections.add(c);
    c.on('open',()=>{
      if(this.closed || !this.connections.has(c)){c.close();return;}
      if(this.role==='host'){if(this.route)this.send(c,this.route);if(this.progress)this.send(c,this.progress);}
      else {clearTimeout(this.timer);this.events.status('Connected · waiting for location');this.events.ready?.();}
    });
    if(this.role==='viewer')c.on('data',raw=>{if(this.closed || !this.connections.has(c))return;const m=parseTripMessage(raw);if(m){this.lastReceived=Date.now();this.events.message?.(m);}if(m?.type==='ended'){this.events.status('Trip sharing ended');this.close();}});
    c.on('close',()=>{if(!this.connections.has(c))return;this.connections.delete(c);if(!this.closed && this.role==='viewer'){this.events.status('Rider disconnected · updates stopped');this.failed();}});
    c.on('error',()=>{c.close();this.connections.delete(c);if(this.role==='viewer'){this.events.status('Connection lost · retry to reconnect');this.failed();}});
  }
  publish(raw:TripMessage){if(this.role!=='host'||this.closed)return;const m=parseTripMessage(raw);if(!m)return;if(m.type==='route'){if(JSON.stringify(this.route)===JSON.stringify(m))return;this.route=m;}if(m.type==='progress'){this.progress=m;if(m.progress.updatedAt-this.lastSent<5000)return;this.lastSent=m.progress.updatedAt;}for(const c of this.connections)if(c.open)this.send(c,m);}
  private reconnectSignaling(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.failed(),20000);try{this.peer.reconnect();}catch{this.failed();}}
  private failed(){if(this.closed)return;this.close(false);this.events.recover?.();}
  resume(){if(this.peer.destroyed && !this.closed){this.failed();return;}if(this.closed){this.events.recover?.();return;}if(this.peer.disconnected)this.reconnectSignaling();if(this.role==='viewer' && (!this.connections.size || Date.now()-this.lastReceived>=30000))this.failed();}
  close(revoke=true){if(this.closed)return;this.closed=true;clearTimeout(this.timer);if(this.healthTimer)clearInterval(this.healthTimer);if(this.presenceTimer)clearInterval(this.presenceTimer);this.presence.clear();this.reportViewers();for(const c of this.connections){if(revoke && this.role==='host'&&c.open)c.send({type:'ended'});c.close();}this.connections.clear();this.peer.destroy();}
}
export async function createSession(role:'host'|'viewer',pin:string,events:SessionEvents,viewerId?:string,options:typeof peerOptions|{debug:0}=peerOptions){
  if(!PIN_PATTERN.test(pin))throw new Error('Invalid sharing code');

  const Peer=await loadPeerConstructor();const bytes=role==='viewer'?(typeof crypto!=='undefined'&&crypto.getRandomValues?crypto.getRandomValues(new Uint8Array(16)):await (await import('expo-crypto')).getRandomBytesAsync(16)):new Uint8Array();
  return new PeerSession(role==='host'?new Peer(`velunivo-${pin}`,options):new Peer(clientPeerId('viewer',bytes),options),role,pin,events,viewerId);
}
