import {Fix} from './types';
import {distance} from './geo';
/** Several fresh moving readings are required; walking speed and stationary drift do not qualify. */
export class RidingPromptDetector {
 private first:Fix|null=null;private previous:Fix|null=null;private meters=0;private count=0;
 reset(){this.first=null;this.previous=null;this.meters=0;this.count=0;}
 accept(fix:Fix,now=Date.now()){if(fix.timestamp>now+1000||now-fix.timestamp>5000||fix.accuracy<0||fix.accuracy>25||fix.speed===null||fix.speed<2||fix.speed>20){this.reset();return false;}if(this.previous&&fix.timestamp<=this.previous.timestamp)return false;if(this.previous&&fix.timestamp-this.previous.timestamp>5000)this.reset();if(!this.first)this.first=fix;if(this.previous){const meters=distance(this.previous.coordinate,fix.coordinate);if(meters/((fix.timestamp-this.previous.timestamp)/1000)>25){this.reset();return false;}this.meters+=meters;}this.previous=fix;this.count++;return this.count>=4&&fix.timestamp-this.first.timestamp>=8000&&this.meters>=20;}
}
