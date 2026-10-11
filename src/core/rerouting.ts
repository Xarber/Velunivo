import {Fix} from './types';
/** Sustained off-route fixes only; one request at a time and a bounded retry rate. */
export class RerouteGate {
 private since=0;private count=0;private last=0;private pending=false;
 ready(fix:Fix,offRoute:boolean,enabled:boolean){
  if(!enabled||!offRoute||fix.accuracy>25){this.since=0;this.count=0;return false;}
  if(!this.since)this.since=fix.timestamp;this.count++;
  if(this.pending||this.count<3||fix.timestamp-this.since<8000||fix.timestamp-this.last<30000)return false;
  this.pending=true;this.last=fix.timestamp;return true;
 }
 get busy(){return this.pending;}
 finish(){this.pending=false;this.since=0;this.count=0;}
}
