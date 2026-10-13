export class NavigationHapticGate {
 private routeId='';private cue='';private offAt:number|undefined;private warned=false;
 next(input:{valid:boolean;offRoute:boolean;arrived:boolean;next?:{index:number};maneuverMeters?:number},now:number,routeId=''):'turn'|'off-route'|null{
  if(routeId!==this.routeId){this.routeId=routeId;this.cue='';this.offAt=undefined;this.warned=false;}
  if(!input.valid||input.arrived)return null;
  if(input.offRoute){this.offAt??=now;if(!this.warned&&now-this.offAt>=4000){this.warned=true;return 'off-route';}return null;}
  this.offAt=undefined;this.warned=false;
  if(!input.next||(input.maneuverMeters??Infinity)>=150)return null;
  const cue=`${input.next.index}-${(input.maneuverMeters??0)<40?'near':'ahead'}`;if(cue===this.cue)return null;this.cue=cue;return 'turn';
 }
}
