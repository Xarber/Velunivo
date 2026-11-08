// SPDX-License-Identifier: AGPL-3.0-only
import {m365ControlsAvailable,safeStationary} from '../bluetooth/plugins/m365ControlPolicy';
import {BridgeSnapshot} from '../bluetooth/types';
import {NavigationActivity} from './liveActivity';
import {t} from '../i18n/core';
import {Fix} from './types';
import {distance} from './geo';
export function ridingPromptProps(snapshot:BridgeSnapshot,vehicleId?:string,now=Date.now()):NavigationActivity{
 const locked=snapshot.extensions.locked;
 const known=!!vehicleId&&m365ControlsAvailable(snapshot,vehicleId)&&locked?.source==='vehicle'&&typeof locked.value==='boolean'&&Math.abs(now-locked.timestamp)<10000;
 return {ridingPrompt:true,turn:t('Are you riding?'),symbol:'arrow.up',distance:'',arrival:'',minutes:'',remaining:'',recordLabel:t('Start recording'),searchLabel:t('Find destination'),...(known?{promptLockTarget:`ride-prompt:${locked!.value?'unlock':'lock'}:${encodeURIComponent(vehicleId!)}`,promptLockLabel:t(locked!.value?'Unlock vehicle':'Lock vehicle'),promptLockEnabled:safeStationary(snapshot,now)}:{})};
}

/** Several fresh moving readings are required; walking speed and stationary drift do not qualify. */
export class RidingPromptDetector {
 private first:Fix|null=null;private previous:Fix|null=null;private meters=0;private count=0;
 reset(){this.first=null;this.previous=null;this.meters=0;this.count=0;}
 accept(fix:Fix,now=Date.now()){if(fix.timestamp>now+1000||now-fix.timestamp>5000||fix.accuracy<0||fix.accuracy>25||fix.speed===null||fix.speed<2||fix.speed>20){this.reset();return false;}if(this.previous&&fix.timestamp<=this.previous.timestamp)return false;if(this.previous&&fix.timestamp-this.previous.timestamp>5000)this.reset();if(!this.first)this.first=fix;if(this.previous){const meters=distance(this.previous.coordinate,fix.coordinate);if(meters/((fix.timestamp-this.previous.timestamp)/1000)>25){this.reset();return false;}this.meters+=meters;}this.previous=fix;this.count++;return this.count>=4&&fix.timestamp-this.first.timestamp>=8000&&this.meters>=20;}
}
