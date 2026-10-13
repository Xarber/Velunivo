import {Fix} from './types';
import {freshFix,bearing,normalizeHeading} from './rideView';
import {distance} from './geo';
import {headingDelta} from './camera';
export interface HeadingResult {heading:number;source:string;travelOverride:boolean;}
/** Compass is primary. A pocket/sideways phone must disagree for eight moving seconds before overriding it. */
export class TravelHeadingTracker {
 private anchor:Fix|null=null;private course:number|null=null;private courseAt=0;private inferredSpeed:number|null=null;
 private mismatchSince:number|null=null;private alignedSince:number|null=null;private stoppedSince:number|null=null;private override=false;
 next(fix:Fix|null,compass:{heading:number|null;timestamp:number},enabled:boolean,fallback:{heading:number;source:string},now:number):HeadingResult{
  const precise=freshFix(fix,now)&&fix!.accuracy<=25;
  let moving=precise&&(fix!.speed??0)>=1.5;
  if(precise){
   const f=fix!;
   if(moving&&f.heading!==undefined&&Number.isFinite(f.heading)&&f.heading>=0&&f.heading<360){this.course=f.heading;this.courseAt=f.timestamp;}
   else if((moving||f.speed==null)&&this.anchor&&f.timestamp>this.anchor.timestamp&&f.timestamp-this.anchor.timestamp<=15000){
    const delta=distance(this.anchor.coordinate,f.coordinate),seconds=(f.timestamp-this.anchor.timestamp)/1000;
    if(delta>=Math.max(8,(f.accuracy+this.anchor.accuracy)*.6)&&delta/seconds>=1.5&&delta/seconds<20){this.course=bearing(this.anchor.coordinate,f.coordinate);this.courseAt=f.timestamp;this.anchor=f;this.inferredSpeed=delta/seconds;moving=true;}
   }
   if(!this.anchor||f.timestamp-this.anchor.timestamp>15000)this.anchor=f;
  }
  const freshCourse=this.course!==null&&now-this.courseAt<=5000;
  if(precise&&fix!.speed==null&&freshCourse&&this.inferredSpeed!==null&&this.inferredSpeed>=1.5)moving=true;
  const compassValid=enabled&&compass.heading!==null&&Number.isFinite(compass.heading)&&now>=compass.timestamp-1000&&now-compass.timestamp<3000;
  if(!compassValid){this.mismatchSince=null;this.alignedSince=null;return {heading:freshCourse?this.course!:fallback.heading,source:freshCourse?'GPS direction':fallback.source,travelOverride:false};}
  const disagreement=freshCourse?Math.abs(headingDelta(compass.heading!,this.course!)):0;
  if(moving&&freshCourse&&disagreement>=50){this.alignedSince=null;this.stoppedSince=null;this.mismatchSince??=now;if(now-this.mismatchSince>=8000)this.override=true;}
  else{
   this.mismatchSince=null;
   if(this.override){
    const stopped=precise&&(fix!.speed??Infinity)<.8;
    if(stopped){this.stoppedSince??=now;if(now-this.stoppedSince>=5000)this.override=false;}else this.stoppedSince=null;
    if(moving&&freshCourse&&disagreement<=25){this.alignedSince??=now;if(now-this.alignedSince>=5000)this.override=false;}else this.alignedSince=null;
   }
  }
  if(this.override&&freshCourse)return {heading:normalizeHeading(this.course!),source:'Travel direction · compass misaligned',travelOverride:true};
  // If GPS temporarily goes stale, keep the last travel heading until reliable data resolves the mismatch.
  if(this.override&&this.course!==null&&now-this.courseAt<=15000)return {heading:this.course,source:'Travel direction · compass misaligned',travelOverride:true};
  return {heading:normalizeHeading(compass.heading!),source:'Device compass',travelOverride:false};
 }
}
