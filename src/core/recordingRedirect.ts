import {Fix} from './types';import {freshFix} from './rideView';
/** Never hand off before the new recording has GPS and its native background task. */
export function recordingRedirectReady(active:boolean,startedAt:number|undefined,fix:Fix|null,backgroundReady:boolean,web:boolean){return active&&!!startedAt&&freshFix(fix)&&fix!.timestamp>=startedAt&&(web||backgroundReady);}
