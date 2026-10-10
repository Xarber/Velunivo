import { Route, Profile, NavigationOptions, Fix } from './types';
import { guidance } from './navigation';
import { estimate, minutes } from './eta';
import { arrivalTime, maneuverDistance, distanceLeft } from './rideView';
export interface NavigationActivity { turn: string; symbol: 'flag.fill' | 'arrow.turn.up.left' | 'arrow.turn.up.right' | 'arrow.up'; distance: string; arrival: string; minutes: string; remaining: string; }

export function rideActivity(route:Route,profile:Profile,options:NavigationOptions,g:ReturnType<typeof guidance>,fix?:Fix):NavigationActivity {
 const eta=estimate(route,profile,g.offRoute ? 0 : g.along);
 return {turn:!g.valid ? 'Waiting for a precise GPS fix' : g.arrived ? 'You have arrived' : g.offRoute ? 'Off route · stop safely to replan' : g.next?.text || 'Follow the route',symbol:g.arrived || g.next?.sign===4 ? 'flag.fill' : g.next?.sign && g.next.sign<0 ? 'arrow.turn.up.left' : g.next?.sign && g.next.sign>0 ? 'arrow.turn.up.right' : 'arrow.up',distance:g.maneuverMeters===undefined ? '—' : maneuverDistance(g.maneuverMeters,options.unit),arrival:arrivalTime(eta.seconds,fix?.timestamp),minutes:minutes(eta.seconds),remaining:distanceLeft(eta.meters,options.unit)};
}
