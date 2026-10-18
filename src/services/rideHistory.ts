import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRideArchive } from '../core/rideArchive';
const archive=createRideArchive(AsyncStorage);
export const { liveRecording, recordedRides, persistRide, rideSamples, deleteRecordedRide, subscribeRides, updateRideLabels } = archive;

export async function saveBatteryUsage(id:string,percent:number|null){const ride=(await archive.recordedRides()).find(r=>r.id===id);await archive.saveBatteryUsage(id,percent);if(ride&&percent!==null){const {applyManualBatteryUsage}=await import('./lastBattery');await applyManualBatteryUsage(ride,percent);}}
