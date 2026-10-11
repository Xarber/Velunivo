import AsyncStorage from '@react-native-async-storage/async-storage';
import {RecordedRide} from '../core/recordings';
import {restorePlaces} from '../core/places';
import {nearestSavedPlace,automaticTripName} from '../core/tripNames';
import {reverseAddress} from './api';
import {updateRideLabels} from './rideHistory';
/** Only two endpoint lookups after a completed trip, never a continuous location upload. */
export async function nameRecordedTrip(ride:RecordedRide){
 if(!ride.start||!ride.end)return;
 const places=restorePlaces(await AsyncStorage.getItem('places-v1')),a=nearestSavedPlace(ride.start,places),b=nearestSavedPlace(ride.end,places);
 const [start,end]=await Promise.all([a?.address||reverseAddress(ride.start).catch(()=>undefined),b?.address||reverseAddress(ride.end).catch(()=>undefined)]);
 await updateRideLabels(ride.id,{name:automaticTripName(a?.name,b?.name),startLabel:a?`${a.name} · ${a.address}`:start,endLabel:b?`${b.name} · ${b.address}`:end});
}
