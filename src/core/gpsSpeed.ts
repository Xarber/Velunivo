import {Fix} from './types';
import {MovementTracker,usableMovementFix} from './movement';
import {distance} from './geo';
import {bearing} from './rideView';
/** Estimated ground speed from accuracy-filtered GPS travel, never accelerometer integration. */
export class GPSSpeedTracker {
 private movement=new MovementTracker();private points:Fix[]=[];private last=0;private speed:number|null=null;private movedAt=0;private heading:number|undefined;
 next(raw:Fix,forceEstimate=false):Fix{
  if(!forceEstimate&&raw.speed!==null&&Number.isFinite(raw.speed)&&raw.speed>=0)return {...raw,speedSource:'gps'};
  if(raw.timestamp<=this.last)return {...raw,speed:null,speedSource:'estimated'};
  const gap=this.last>0&&raw.timestamp-this.last>15000;this.last=raw.timestamp;
  if(!usableMovementFix(raw)||gap){this.points=[];this.speed=null;this.movedAt=0;this.heading=undefined;this.movement=new MovementTracker();}
  const anchor=this.movement.anchor;const delta=anchor?distance(anchor.coordinate,raw.coordinate):0;
  const elapsed=anchor?(raw.timestamp-anchor.timestamp)/1000:0;
  const inferred=elapsed>=1&&delta>=Math.max(8,raw.accuracy*1.5)&&delta/elapsed<=25?delta/elapsed:null;
  const tracked=this.movement.next({...raw,speed:inferred});
  if(tracked?.point){const point=tracked.point,previous=this.points.at(-1);if(tracked.breakBefore)this.points=[];
   if(previous&&!tracked.breakBefore){this.heading=bearing(previous.coordinate,point.coordinate)??undefined;this.movedAt=point.timestamp;}
   this.points.push(point);while(this.points.length>2&&point.timestamp-this.points[1].timestamp>8000)this.points.shift();
   const seconds=(point.timestamp-this.points[0].timestamp)/1000;let meters=0;for(let i=1;i<this.points.length;i++)meters+=distance(this.points[i-1].coordinate,this.points[i].coordinate);
   this.speed=seconds>=1&&meters/seconds<=25?meters/seconds:null;
  }
  if(usableMovementFix(raw)&&this.points.length&&raw.timestamp-(this.movedAt||this.points[0].timestamp)>=5000)this.speed=0;
  return {...raw,speed:this.speed,speedSource:'estimated',rawSpeed:raw.speed,heading:raw.heading??this.heading};
 }
}
