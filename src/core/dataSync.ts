import {ImportMode,MAX_BACKUP} from './dataTransfer';
export const SYNC_CHUNK=12000;
export type SyncPacket={type:'offer';session:string;mode:ImportMode;summary:string}|{type:'accept';session:string}|{type:'chunk';session:string;index:number;total:number;value:string}|{type:'ack';session:string;index:number}|{type:'complete';session:string}|{type:'cancel';session:string};
export function parseSyncPacket(raw:unknown):SyncPacket|null{const x=raw as SyncPacket;if(!x||typeof x!=='object'||typeof x.session!=='string'||!/^\w{16,64}$/.test(x.session))return null;if(x.type==='offer')return ['merge','overwrite'].includes(x.mode)&&typeof x.summary==='string'&&x.summary.length<300?x:null;if(['accept','complete','cancel'].includes(x.type))return x;if(x.type==='ack')return Number.isInteger(x.index)&&x.index>=0?x:null;if(x.type==='chunk')return Number.isInteger(x.index)&&Number.isInteger(x.total)&&x.total>0&&x.total<=Math.ceil(MAX_BACKUP/SYNC_CHUNK)&&x.index>=0&&x.index<x.total&&typeof x.value==='string'&&x.value.length<=SYNC_CHUNK?x:null;return null;}
/** Payload transfer starts only after independent consent on BOTH devices. Stop-and-wait bounds memory/channel pressure. */
export class DataSyncSession {
 private local=false;private remote=false;private sent=-1;private awaiting=false;private received:string[]=[];private total=0;private ended=false;private applying=false;
 private offer?:Extract<SyncPacket,{type:'offer'}>;
 constructor(private role:'sender'|'receiver',private send:(message:SyncPacket)=>void,private events:{offer(message:Extract<SyncPacket,{type:'offer'}>):void;status(message:string):void;received(text:string,mode:ImportMode):Promise<void>},private data?:{text:string;session:string;mode:ImportMode;summary:string}){}
 open(){if(this.role==='sender'&&this.data){this.offer={type:'offer',session:this.data.session,mode:this.data.mode,summary:this.data.summary};this.send(this.offer);this.events.offer(this.offer);}}
 approve(){if(!this.offer||this.ended)return;this.local=true;this.send({type:'accept',session:this.offer.session});this.pump();this.events.status('Waiting for both devices to accept.');}
 private pump(){if(this.awaiting||this.role!=='sender'||!this.local||!this.remote||!this.data||this.ended)return;const chunks=Math.ceil(this.data.text.length/SYNC_CHUNK);if(this.sent+1>=chunks)return;this.sent++;this.awaiting=true;this.send({type:'chunk',session:this.data.session,index:this.sent,total:chunks,value:this.data.text.slice(this.sent*SYNC_CHUNK,(this.sent+1)*SYNC_CHUNK)});this.events.status('Transferring data…');}
 async receive(raw:unknown){const m=parseSyncPacket(raw);if(!m||this.ended)return;if(m.type==='offer'&&this.role==='receiver'&&!this.offer){this.offer=m;this.events.offer(m);return;}if(!this.offer||m.session!==this.offer.session)return;
 if(m.type==='cancel'){this.ended=true;this.events.status('Transfer cancelled.');return;}
 if(m.type==='accept'){this.remote=true;this.pump();return;}
 if(m.type==='ack'&&this.role==='sender'&&this.local&&this.remote&&m.index===this.sent){this.awaiting=false;this.pump();return;}
 if(m.type==='complete'&&this.role==='sender'&&this.local&&this.remote){this.ended=true;this.events.status('Data transferred.');return;}
 if(m.type!=='chunk'||this.role!=='receiver'||!this.local||!this.remote||this.applying)return;
 if(m.index!==this.received.length||(this.total&&this.total!==m.total)){this.cancel();return;}this.total=m.total;this.received.push(m.value);if(this.received.reduce((n,s)=>n+s.length,0)>MAX_BACKUP){this.cancel();return;}
 if(this.received.length===this.total){this.applying=true;try{await this.events.received(this.received.join(''),this.offer.mode);this.send({type:'complete',session:m.session});this.ended=true;this.events.status('Data imported.');}catch{this.cancel();this.events.status('Import failed. Check your backup before retrying.');}this.received=[];}else this.send({type:'ack',session:m.session,index:m.index});
 }
 cancel(){if(this.offer&&!this.ended)this.send({type:'cancel',session:this.offer.session});this.ended=true;this.received=[];this.events.status('Transfer cancelled.');}
}
