import {isReplacingGroupActivity} from './activityReplacement';
import {useEffect,useRef} from 'react';import {useGroupRide} from './GroupProvider';import {Coord,Route} from '../core/types';
/** A group never feeds remote positions into the local recorder. Ride completion revokes membership. */
export function useRideGroup(active:boolean,position:Coord|null,route:Route|null){const group=useGroupRide(),publish=group.publish,wasActive=useRef(false),leave=useRef(group.leave);useEffect(()=>{leave.current=group.leave;},[group.leave]);
 useEffect(()=>{if(active&&!isReplacingGroupActivity())publish(position,route);},[active,position,route,publish]);
 useEffect(()=>{if(wasActive.current&&!active&&!isReplacingGroupActivity())leave.current();wasActive.current=active;},[active]);
 useEffect(()=>()=>{if(wasActive.current&&!isReplacingGroupActivity())leave.current();},[]);return group;
}
