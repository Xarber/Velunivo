import {VoiceSignal} from './model';
export interface VideoFeed {stream?:MediaStream;url?:string;}
export interface VoiceMedia {connected?(count:number,muted:boolean):Promise<void>;idle?():Promise<void>;setVideo?(enabled:boolean,peers:string[]):Promise<void>;attach(connection:VoiceConnection):void;muteSelf(muted:boolean):void|Promise<void>;stop():void;}
export interface VoiceConnection {offer(restart:boolean):Promise<string>;answer():Promise<string>;remote(type:'offer'|'answer',sdp:string):Promise<void>;ice(candidate:Extract<VoiceSignal,{type:'ice'}>['candidate']):Promise<void>;mute(muted:boolean):void;close():void;}
export interface VoiceFactory {media(muted?:boolean):Promise<VoiceMedia>;connection(id:string,emit:(signal:VoiceSignal)=>void,state:(state:string)=>void,video?:boolean):VoiceConnection;stop():Promise<void>;}
interface VoicePeer {connection:VoiceConnection;ready:boolean;ice:Extract<VoiceSignal,{type:'ice'}>['candidate'][];retry?:ReturnType<typeof setTimeout>;busy:boolean;state:string;attempts:number;session?:string;queue:Promise<void>;retired:Set<string>;incoming:Map<string,Extract<VoiceSignal,{type:'ice'}>['candidate'][]>;}
/** One audio-only connection per pair; ICE restart and bounded connection rebuild recover dropped calls. */
export class GroupVoice {
 private videoPeers=new Set<string>();private peers=new Map<string,VoicePeer>();private muted=new Set<string>();private media?:VoiceMedia;private stopped=false;private allMuted=false;private selfMuted=false;private microphoneWanted=false;private microphoneBlocked=false;
 constructor(private id:string,private factory:VoiceFactory,private send:(id:string,s:VoiceSignal)=>void,private status:(s:string)=>void,private peersChanged:(count:number)=>void=()=>{}){}
 async start(muted=false){this.selfMuted=muted;this.media=await this.factory.media(true);if(this.stopped){this.media.stop();await this.factory.stop();return false;}this.refreshMicrophone();this.status('Voice chat ready');return true;}
 sync(ids:string[],videoIds:string[]=[]){const desired=new Set(videoIds);const changed=[...this.peers.keys()].filter(id=>this.videoPeers.has(id)!==desired.has(id));const retired=new Map(changed.map(id=>[id,this.peers.get(id)!]));this.videoPeers=desired;for(const id of changed){const old=this.peers.get(id)!;this.peers.delete(id);clearTimeout(old.retry);old.connection.close();}if(!this.media||this.stopped)return;for(const [id,p] of this.peers)if(!ids.includes(id)){this.peers.delete(id);clearTimeout(p.retry);p.connection.close();}for(const id of ids)if(id!==this.id&&!this.peers.has(id)){const added=this.add(id),old=retired.get(id);if(old){added.retired=new Set(old.retired);if(old.session)added.retired.add(old.session);}if(this.id<id)void this.offer(id,false);}this.refreshMicrophone();}
 private add(id:string){const connection=this.factory.connection(id,s=>{const p=this.peers.get(id);if(p?.connection===connection)this.send(id,{...s,...(p.session?{session:p.session}:{})});},state=>{const p=this.peers.get(id);if(this.stopped||!p||p.connection!==connection)return;p.state=state;if(state==='failed'||state==='disconnected'||state==='closed'){this.status('Voice connection interrupted. Reconnecting…');this.retry(id);}else if(state==='connected'){clearTimeout(p.retry);p.retry=undefined;p.attempts=0;this.status('Voice chat connected');}this.refreshMicrophone();},this.videoPeers.has(id));this.media!.attach(connection);connection.mute(this.allMuted||this.muted.has(id));const p:VoicePeer={connection,ready:false,ice:[],busy:false,state:'new',attempts:0,session:this.id<id?Math.random().toString(36).slice(2)+Date.now().toString(36):undefined,queue:Promise.resolve(),retired:new Set(),incoming:new Map()};this.peers.set(id,p);return p;}
 private rebuild(id:string){const old=this.peers.get(id);if(old){this.peers.delete(id);clearTimeout(old.retry);old.connection.close();}const next=this.add(id);if(old){next.retired=new Set(old.retired);if(old.session)next.retired.add(old.session);}return next;}
 private async offer(id:string,restart:boolean){let p=this.peers.get(id);if(!p||p.busy||this.stopped)return;if(p.state==='closed'||p.attempts>=3)p=this.rebuild(id);clearTimeout(p.retry);p.retry=undefined;p.busy=true;p.attempts++;try{const sdp=await p.connection.offer(restart);if(this.peers.get(id)!==p||this.stopped)return;this.send(id,{type:'offer',sdp,session:p.session});if(this.peers.get(id)===p&&p.state!=='connected'){p.retry=setTimeout(()=>{p.retry=undefined;if(!this.stopped)void this.offer(id,true);},15000);}}catch{this.retry(id);}finally{p.busy=false;}}
 private retry(id:string){const p=this.peers.get(id);if(!p||p.retry||this.id>id)return;p.retry=setTimeout(()=>{p.retry=undefined;if(!this.stopped)void this.offer(id,true);},5000);}
 async signal(id:string,s:VoiceSignal){
  if(!this.media||this.stopped)return;
  if(s.type!=='ice'&&/^m=video\s/m.test(s.sdp)&&!this.videoPeers.has(id))return;
  let p=this.peers.get(id)??this.add(id);
  if(s.session&&p.retired.has(s.session))return;
  if(s.type==='offer'&&s.session&&p.session&&s.session!==p.session){
   // A new remote connection must never inherit an old answer or ICE candidates.
   if(this.id<id)return;p=this.rebuild(id);
  }
  if(s.type==='offer'&&p.state==='closed')p=this.rebuild(id);
  if(s.type==='offer'&&s.session)p.session=s.session;
  if(s.session&&s.session!==p.session){
   if(s.type==='ice'&&this.id>id&&!p.session){const candidates=p.incoming.get(s.session)??[];if(candidates.length<100&&p.incoming.size<8){candidates.push(s.candidate);p.incoming.set(s.session,candidates);}}
   return;
  }
  const peer=p;
  peer.queue=peer.queue.catch(()=>{}).then(async()=>{
   if(this.stopped||this.peers.get(id)!==peer)return;
   try{
    if(s.type==='ice'){if(peer.ready)await peer.connection.ice(s.candidate);else if(peer.ice.length<100)peer.ice.push(s.candidate);return;}
    await peer.connection.remote(s.type,s.sdp);
    if(this.peers.get(id)!==peer||this.stopped)return;
    peer.ready=true;
    for(const ice of [...peer.ice,...(peer.incoming.get(s.session??'')??[])])await peer.connection.ice(ice);
    peer.ice=[];peer.incoming.clear();
    if(s.type==='offer')this.send(id,{type:'answer',sdp:await peer.connection.answer(),session:peer.session});
   }catch{if(this.peers.get(id)===peer){this.status('Voice connection interrupted. Reconnecting…');this.retry(id);}}
  });
  await peer.queue;
 }

 async mute(id:string,muted:boolean){if(muted)this.muted.add(id);else this.muted.delete(id);if(id===this.id){this.selfMuted=muted;if(!muted)this.microphoneBlocked=false;await this.refreshMicrophone();}else this.peers.get(id)?.connection.mute(this.allMuted||muted);}
 private refreshMicrophone(){const count=[...this.peers.values()].filter(p=>p.state==='connected').length;this.peersChanged(count);void this.media?.connected?.(count,!count||this.selfMuted||this.microphoneBlocked).catch(()=>this.status('Voice chat unavailable. Check microphone permission.'));if(!count&&!this.peers.size)void this.media?.idle?.().catch(()=>{});const wanted=count>0&&!this.selfMuted&&!this.stopped&&!this.microphoneBlocked;if(wanted===this.microphoneWanted)return Promise.resolve();this.microphoneWanted=wanted;return Promise.resolve(this.media?.muteSelf(!wanted)).catch(()=>{this.microphoneWanted=false;this.microphoneBlocked=true;this.status('Voice chat unavailable. Check microphone permission.');});}
 async camera(enabled:boolean,peers:string[]){await this.media?.setVideo?.(enabled,peers);}
 muteAll(muted:boolean){this.allMuted=muted;for(const [id,p] of this.peers)p.connection.mute(muted||this.muted.has(id));}
 resume(){this.microphoneBlocked=false;this.refreshMicrophone();for(const id of this.peers.keys())if(this.id<id&&this.peers.get(id)?.state!=='connected')void this.offer(id,true);}
 async close(){if(this.stopped)return;this.stopped=true;this.peersChanged(0);for(const p of this.peers.values()){clearTimeout(p.retry);p.connection.close();}this.peers.clear();this.media?.stop();try{await this.factory.stop();}catch{/* Native teardown must not crash the ride UI. */}}
}
