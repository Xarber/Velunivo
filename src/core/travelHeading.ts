import {Fix} from './types';
import {freshFix,bearing,normalizeHeading} from './rideView';
import {distance} from './geo';
import {headingDelta} from './camera';
export interface HeadingResult {heading:number;source:string;travelOverride:boolean;}
/** Compass is primary. A pocket/sideways phone must disagree for eight moving seconds before overriding it. */
export class TravelHeadingTracker {
 private anchor:Fix|null=null;private course:number|null=null;private courseAt=0;private inferredSpeed:number|null=null;
 private displayed:HeadingResult|null=null;private confirmedHeading:number|null=null;private confirmedCourse:number|null=null;private lastCompassEnabled:boolean|undefined;private motionAnchor:Fix|null=null;private observedCourse:number|null=null;private observedAt=0;
 private compassOffset=0;private offsetMismatchSince:number|null=null;private mismatchSince:number|null=null;private alignedSince:number|null=null;private stoppedSince:number|null=null;private override=false;
 /** A route tangent can initialize direction, but cannot anticipate the next corner. */
 private confirm(result:HeadingResult,moving:boolean,now:number):HeadingResult{
  const previous=this.displayed;
  if(previous){
   if(result.source==='Route direction')return {...previous,travelOverride:result.travelOverride};
   const changing=Math.abs(headingDelta(this.confirmedHeading??previous.heading,result.heading))>8;
   if(moving&&changing){
    const observed=this.observedCourse!==null&&now-this.observedAt<=5000;
    const hasTurned=observed&&Math.abs(headingDelta(this.confirmedCourse??previous.heading,this.observedCourse!))>=8;
    const agrees=observed&&Math.abs(headingDelta(this.observedCourse!,result.heading))<=35;
    if((!hasTurned&&!result.travelOverride)||!agrees)return {...previous,travelOverride:result.travelOverride};
   }
  }
  if(!previous||!moving||result.travelOverride||this.observedCourse!==null&&Math.abs(headingDelta(this.confirmedCourse??previous.heading,this.observedCourse))>=8){this.confirmedHeading=result.heading;this.confirmedCourse=this.observedCourse??this.course;}
  this.displayed=result;return result;
 }
 next(fix:Fix|null,compass:{heading:number|null;timestamp:number},enabled:boolean,fallback:{heading:number;source:string},now:number):HeadingResult{
  if(this.lastCompassEnabled!==undefined&&this.lastCompassEnabled!==enabled){this.displayed=null;this.confirmedHeading=null;this.confirmedCourse=null;}this.lastCompassEnabled=enabled;
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
  if(precise&&moving&&fix!.timestamp!==(this.motionAnchor?.timestamp??0)){
   const f=fix!,anchor=this.motionAnchor;
   if(!anchor||f.timestamp-anchor.timestamp>15000)this.motionAnchor=f;
   else if(f.timestamp>anchor.timestamp){const seconds=(f.timestamp-anchor.timestamp)/1000,meters=distance(anchor.coordinate,f.coordinate);
    if(meters>=Math.max(4,(anchor.accuracy+f.accuracy)*.5)&&meters/seconds<25){this.observedCourse=bearing(anchor.coordinate,f.coordinate);this.observedAt=f.timestamp;this.motionAnchor=f;}
   }
  }
  const compassValid=enabled&&compass.heading!==null&&Number.isFinite(compass.heading)&&now>=compass.timestamp-1000&&now-compass.timestamp<3000;
  if(!compassValid){this.mismatchSince=null;this.alignedSince=null;return this.confirm({heading:freshCourse?this.course!:fallback.heading,source:freshCourse?'GPS direction':fallback.source,travelOverride:false},moving,now);}
  const disagreement=freshCourse?Math.abs(headingDelta(compass.heading!,this.course!)):0;
  if(moving&&freshCourse&&disagreement>=50){this.alignedSince=null;this.stoppedSince=null;this.mismatchSince??=now;if(now-this.mismatchSince>=8000&&!this.override){this.override=true;this.compassOffset=headingDelta(compass.heading!,this.course!);}}
  else{
   this.mismatchSince=null;
   if(this.override){
    const stopped=precise&&(fix!.speed??Infinity)<.8;
    if(stopped){this.stoppedSince??=now;if(now-this.stoppedSince>=5000){this.override=false;this.compassOffset=0;}}else this.stoppedSince=null;
    if(moving&&freshCourse&&disagreement<=25){this.alignedSince??=now;if(now-this.alignedSince>=5000){this.override=false;this.compassOffset=0;}}else this.alignedSince=null;
   }
  }
  if(this.override&&freshCourse){let corrected=normalizeHeading(compass.heading!+this.compassOffset);const error=Math.abs(headingDelta(corrected,this.course!));if(error>30&&moving){this.offsetMismatchSince??=now;if(now-this.offsetMismatchSince>=5000){this.compassOffset=headingDelta(compass.heading!,this.course!);corrected=normalizeHeading(this.course!);this.offsetMismatchSince=null;}}else this.offsetMismatchSince=null;if(this.displayed&&Math.abs(headingDelta(this.displayed.heading,corrected))<5)corrected=this.displayed.heading;return this.confirm({heading:corrected,source:'Travel direction · compass misaligned',travelOverride:true},moving,now);}
  // If GPS temporarily goes stale, keep the last travel heading until reliable data resolves the mismatch.
  if(this.override&&this.course!==null&&now-this.courseAt<=15000)return this.confirm({heading:this.course,source:'Travel direction · compass misaligned',travelOverride:true},moving,now);
  return this.confirm({heading:normalizeHeading(compass.heading!),source:'Device compass',travelOverride:false},moving,now);
 }
}
