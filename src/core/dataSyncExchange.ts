import {DataSyncChoice,SyncChoicePacket} from './dataSyncChoice';
import {DataSyncSession,SyncPacket} from './dataSync';
import {ImportMode} from './dataTransfer';
type Events={connected():void;chosen(sender:boolean):void;offer(p:Extract<SyncPacket,{type:'offer'}>):void;status(s:string):void;export():Promise<{text:string;summary:string}>;import(text:string,mode:ImportMode):Promise<void>;nonce():string};
/** Single-use, symmetric transfer: either endpoint can send; merge exchanges both collections. */
export class DataSyncExchange {
 private choice:DataSyncChoice;private engine?:DataSyncSession;private ended=false;private mode?:ImportMode;
 constructor(host:boolean,private send:(p:SyncPacket|SyncChoicePacket)=>void,private events:Events){this.choice=new DataSyncChoice(host,send,(sender,mode)=>{this.mode=mode;events.chosen(sender);void this.start(sender,false);});}
 open(){this.events.connected();}
 choose(mode:ImportMode){this.choice.choose(mode);}
 approve(){this.engine?.approve();}
 receive(p:unknown){if(this.ended)return;this.choice.receive(p);void this.engine?.receive(p);}
 cancel(){this.ended=true;this.engine?.cancel();}
 private async start(sender:boolean,returning:boolean){if(this.ended||!this.mode)return;const mode=this.mode;this.events.status(returning?'Synchronizing both devices…':'Preparing transfer…');
  const events={offer:(p:Extract<SyncPacket,{type:'offer'}>)=>{if(returning)this.engine?.approve();else this.events.offer(p);},received:(text:string)=>this.events.import(text,mode),status:(s:string)=>{if(s==='Data imported.'||s==='Data transferred.'){if(mode==='merge'&&!returning){void this.start(!sender,true);}else{this.ended=true;this.events.status(mode==='merge'?'Data synchronized.':s);}}else this.events.status(s==='Waiting for both devices to accept.'?(sender&&!returning?'Waiting for the other device to accept.':returning?'Transferring data…':'Review the transfer and accept on this device.'):s);}};
  if(!sender){this.engine=new DataSyncSession('receiver',this.send,events);return;}
  try{const data=await this.events.export();if(this.ended)return;this.engine=new DataSyncSession('sender',this.send,events,{...data,session:this.events.nonce(),mode});this.engine.open();this.engine.approve();}catch{this.cancel();this.events.status('Data transfer failed.');}
 }
}
