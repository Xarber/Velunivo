import {tripDuration} from './tripDashboard';
import {ActivityExtras} from './activityTelemetry';
import {t} from '../i18n/core';
import { Route, Profile, NavigationOptions, Fix } from './types';
import { guidance } from './navigation';
import { estimate, minutes } from './eta';
import { arrivalTime, maneuverDistance, distanceLeft,displaySpeed } from './rideView';
export interface NavigationActivity extends ActivityExtras { pausedLabel?:string;arrivalLabel?:string;recording?:boolean;updatedAt?:number; turn: string; symbol: 'flag.fill' | 'arrow.turn.up.left' | 'arrow.turn.up.right' | 'arrow.up'; distance: string; arrival: string; minutes: string; remaining: string; }

export function rideActivity(route:Route,profile:Profile,options:NavigationOptions,g:ReturnType<typeof guidance>,fix?:Fix,simulation=false):NavigationActivity {
 const eta=estimate(route,profile,g.offRoute ? 0 : g.along);
 return {arrivalLabel:t('Arrival'),oldLabel:t('Old'),pausedLabel:t('Updates paused · last location may be outdated'),updatedAt:simulation?Date.now():fix?.timestamp,turn:(simulation ? t('Simulation')+' · ' : '') + t(!g.valid ? 'Waiting for a precise GPS fix' : g.arrived ? 'You have arrived' : g.offRoute ? 'Off route · stop safely to replan' : g.next?.text || 'Follow the route'),symbol:g.arrived || g.next?.sign===4 || g.next?.sign===5 ? 'flag.fill' : g.next?.sign && g.next.sign<0 ? 'arrow.turn.up.left' : g.next?.sign && g.next.sign>0 ? 'arrow.turn.up.right' : 'arrow.up',distance:g.maneuverMeters===undefined ? '—' : maneuverDistance(g.maneuverMeters,options.unit),arrival:arrivalTime(eta.seconds,fix?.timestamp),minutes:minutes(eta.seconds),remaining:distanceLeft(eta.meters,options.unit)};
}

export function recordingActivity(fix:Fix|null|undefined,meters:number,startedAt:number,unit:NavigationOptions['unit'],now=Date.now(),speedKmh?:number|null):NavigationActivity{
 const speed=speedKmh===undefined?(fix?.speed==null?null:fix.speed*3.6):speedKmh;
 return {pausedLabel:t('Updates paused · last location may be outdated'),oldLabel:t('Old'),recording:true,updatedAt:fix?.timestamp,turn:t('Recording trip'),symbol:'arrow.up',distance:speed===null?'—':`${displaySpeed(speed,unit).toFixed(0)} ${unit==='mi'?'mph':'km/h'}`,arrival:`${t('Trip time')} · ${tripDuration(startedAt,now)}`,minutes:distanceLeft(meters,unit),remaining:t('Travelled')};
}
