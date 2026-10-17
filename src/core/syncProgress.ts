export interface SyncProgress {fraction:number|null;phase:'preparing'|'sending'|'applying'|'finishing';label:string;}
export const transferProgress=(done:number,total:number,returning:boolean,merge:boolean):SyncProgress=>({fraction:(merge?(returning?.5:0):0)+Math.max(0,Math.min(1,done/Math.max(1,total)))*(merge?.5:1),phase:'sending',label:'Transferring data…'});
