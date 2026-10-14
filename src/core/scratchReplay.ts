import {RecordedRide,RideSample} from './recordings';
import {ScratchIndex,ScratchFixGate,emptyScratch,scratchCell} from './scratchMap';
/** Historical, presentation-only reconstruction from original GPS. Never writes the exploration archive. */
export class ScratchReplay {
  private baseline:ScratchIndex;
  private events:{at:number;cell:string;timestamp:number}[]=[];
  private cursor=0;
  private elapsed=-1;
  private snapshot:{index:ScratchIndex;highlight:string[]};
  private gate=new ScratchFixGate();
  private seen=new Set<string>();
  constructor(private ride:RecordedRide,samples:RideSample[],index:ScratchIndex){
    this.baseline={...emptyScratch(index.resetAt),tiles:Object.fromEntries(Object.entries(index.tiles).filter(([,tile])=>tile.firstVisited<ride.startedAt))};
    for(const sample of [...samples].sort((a,b)=>a.fix.timestamp-b.fix.timestamp))this.append(sample);
    this.snapshot={index:this.baseline,highlight:[]};
  }
  private append(sample:RideSample){const fix=sample.fix;if(!this.gate.accept(fix,fix.timestamp))return;const cell=scratchCell(fix.coordinate);if(this.seen.has(cell))return;this.seen.add(cell);this.events.push({at:Math.max(0,fix.timestamp-this.ride.startedAt),cell,timestamp:fix.timestamp});}
  static async create(ride:RecordedRide,samples:RideSample[],index:ScratchIndex,current:()=>boolean=()=>true){
    const result=new ScratchReplay(ride,[],index),ordered=[...samples].sort((a,b)=>a.fix.timestamp-b.fix.timestamp);
    for(let i=0;i<ordered.length;i++){if(i%200===0){await new Promise(resolve=>setTimeout(resolve,0));if(!current())throw new Error('Selection cancelled');}result.append(ordered[i]);}
    return result;
  }
  seek(elapsed:number){
    if(elapsed<this.elapsed){this.cursor=0;this.snapshot={index:this.baseline,highlight:[]};}
    this.elapsed=elapsed;let tiles:ScratchIndex['tiles']|undefined,latest:string|undefined;
    while(this.cursor<this.events.length&&this.events[this.cursor].at<=elapsed){
      const event=this.events[this.cursor++];latest=event.cell;
      if(!this.snapshot.index.tiles[event.cell]){tiles??={...this.snapshot.index.tiles};tiles[event.cell]={firstVisited:event.timestamp,lastVisited:event.timestamp,modifiedAt:Math.max(this.baseline.resetAt,event.timestamp)};}
    }
    if(latest)this.snapshot={index:tiles?{...this.snapshot.index,tiles}:this.snapshot.index,highlight:[latest]};
    return this.snapshot;
  }
}
