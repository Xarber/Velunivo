import {createViewerPresence} from './viewerPresence';
import {Peer} from 'peerjs';
import type {DataConnection} from 'peerjs';
import {clientPeerId} from './peerIdentity';
import {peerOptions} from './peerOptions';
import { parseTripMessage, PIN_PATTERN, TripMessage } from './model';
export interface SessionEvents { status(s:string):void; message?(m:TripMessage):void; ready?():void; viewers?(count:number):void; }
export class PeerSession {
  private presence=createViewerPresence();
  private viewerCount=-1;
  private presenceTimer?:ReturnType<typeof setInterval>;
  private reportViewers(){if(this.role!=='host')return;const count=this.presence.count();if(count!==this.viewerCount){this.viewerCount=count;this.events.viewers?.(count);}}
  private send(c:DataConnection,m:TripMessage){try{c.send(m);if(m.type==='progress'){this.presence.mark(c.peer || c);this.reportViewers();}}catch{c.close();}}
  private connections = new Set<DataConnection>();
  private route:TripMessage | null=null;
  private progress:TripMessage | null=null;
  private closed=false;
  private lastSent=0;
  private timer:ReturnType<typeof setTimeout>;
  constructor(private peer:Peer,private role:'host'|'viewer',private pin:string,private events:SessionEvents) {
    if(role==='host'){this.reportViewers();this.presenceTimer=setInterval(()=>this.reportViewers(),1000);}
    this.timer=setTimeout(()=>{events.status('Connection timed out. Retry when both devices are online.');this.close();},20000);
    peer.on('error',()=>{if(this.closed)return;events.status('Sharing connection unavailable. Retry when online.');this.close();});
    peer.on('disconnected',()=>{if(this.closed)return;events.status('Signaling disconnected. Sharing may be interrupted.');});
    peer.on('open',()=>{
      if(this.closed)return;
      if(role==='host'){clearTimeout(this.timer);events.status('Live trip sharing is on');events.ready?.();}
      else this.attach(peer.connect(`velunivo-${pin}`,{reliable:true,serialization:'json'}));
    });
    if(role==='host')peer.on('connection',c=>{if(this.closed||this.connections.size>=8){c.close();return;}this.attach(c);});
    peer.on('call',call=>call.close()); // Never acquire or accept audio/video.
  }
  private attach(c:DataConnection) {
    this.connections.add(c);
    c.on('open',()=>{
      if(this.closed){c.close();return;}
      if(this.role==='host'){if(this.route)this.send(c,this.route);if(this.progress)this.send(c,this.progress);}
      else {clearTimeout(this.timer);this.events.status('Connected · waiting for location');this.events.ready?.();}
    });
    if(this.role==='viewer')c.on('data',raw=>{const m=parseTripMessage(raw);if(m)this.events.message?.(m);if(m?.type==='ended'){this.events.status('Trip sharing ended');this.close();}});
    c.on('close',()=>{this.connections.delete(c);if(!this.closed && this.role==='viewer'){this.events.status('Rider disconnected · updates stopped');this.close();}});
    c.on('error',()=>{c.close();this.connections.delete(c);if(this.role==='viewer'){this.events.status('Connection lost · retry to reconnect');this.close();}});
  }
  publish(raw:TripMessage){if(this.role!=='host'||this.closed)return;const m=parseTripMessage(raw);if(!m)return;if(m.type==='route'){if(JSON.stringify(this.route)===JSON.stringify(m))return;this.route=m;}if(m.type==='progress'){this.progress=m;if(m.progress.updatedAt-this.lastSent<5000)return;this.lastSent=m.progress.updatedAt;}for(const c of this.connections)if(c.open)this.send(c,m);}
  close(){if(this.closed)return;this.closed=true;clearTimeout(this.timer);if(this.presenceTimer)clearInterval(this.presenceTimer);this.presence.clear();this.reportViewers();for(const c of this.connections){if(this.role==='host'&&c.open)c.send({type:'ended'});c.close();}this.connections.clear();this.peer.destroy();}
}
export async function createSession(role:'host'|'viewer',pin:string,events:SessionEvents){
  if(!PIN_PATTERN.test(pin))throw new Error('Invalid sharing code');

  return new PeerSession(role==='host'?new Peer(`velunivo-${pin}`,peerOptions):new Peer(clientPeerId('viewer',crypto.getRandomValues(new Uint8Array(16))),peerOptions),role,pin,events);
}
