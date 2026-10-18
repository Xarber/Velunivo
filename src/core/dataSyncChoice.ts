import {parseSyncPacket} from './dataSync';
import {ImportMode} from './dataTransfer';
export type SyncChoicePacket={type:'choose';mode:ImportMode}|{type:'chosen';sender:'host'|'guest';mode:ImportMode};
/** The code owner arbitrates simultaneous choices. A connection can select only one transfer. */
export class DataSyncChoice {
 private chosen=false;
 constructor(private host:boolean,private send:(packet:SyncChoicePacket)=>void,private selected:(sender:boolean,mode:ImportMode)=>void){}
 choose(mode:ImportMode){if(this.chosen)return;if(this.host)this.select('host',mode);else this.send({type:'choose',mode});}
 receive(raw:unknown){const p=raw as SyncChoicePacket;if(this.chosen||!p||!['merge','overwrite'].includes(p.mode))return;if(p.type==='choose'&&this.host)this.select('guest',p.mode);else if(p.type==='chosen'&&!this.host&&['host','guest'].includes(p.sender)){this.chosen=true;this.selected(p.sender==='guest',p.mode);}}
 private select(sender:'host'|'guest',mode:ImportMode){this.chosen=true;this.send({type:'chosen',sender,mode});this.selected(sender==='host',mode);}
}

/** Keep the paired channel in step with the transfer protocol, including snapshot probes. */
export function pairedTransferPacket(raw:unknown){if(parseSyncPacket(raw))return true;const p=raw as SyncChoicePacket;return !!p&&['merge','overwrite'].includes(p.mode)&&(p.type==='choose'||p.type==='chosen'&&['host','guest'].includes(p.sender));}
