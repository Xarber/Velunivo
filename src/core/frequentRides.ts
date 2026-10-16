import {Coord,Fix} from './types';
import {RecordedRide} from './recordings';
import {distance} from './geo';
export interface FrequentRide {start:Coord;end:Coord;startLabel:string;endLabel:string;count:number;lastAt:number;}
/** Only qualified, completed rides near both endpoints form a suggestion. No extra GPS watcher. */
export function frequentRides(rides:readonly RecordedRide[],fix:Fix|null,now=Date.now()):FrequentRide[]{
 if(!fix||fix.accuracy>75||now-fix.timestamp>60000)return [];
 const clusters:FrequentRide[]=[];
 for(const r of rides){
  if(!r.start||!r.end||r.status==='recording'||r.meters<100||now-r.startedAt>120*86400000||distance(fix.coordinate,r.start)>180)continue;
  const cluster=clusters.find(c=>distance(c.start,r.start!)<150&&distance(c.end,r.end!)<180);
  if(cluster){cluster.count++;if(r.startedAt>cluster.lastAt){cluster.lastAt=r.startedAt;cluster.startLabel=r.startLabel;cluster.endLabel=r.endLabel;}}
  else clusters.push({start:r.start,end:r.end,startLabel:r.startLabel,endLabel:r.endLabel,count:1,lastAt:r.startedAt});
 }
 return clusters.filter(c=>c.count>=3).sort((a,b)=>b.count-a.count||b.lastAt-a.lastAt).slice(0,3);
}
