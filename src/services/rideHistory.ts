import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRideArchive } from '../core/rideArchive';
export const { liveRecording, recordedRides, persistRide, rideSamples, deleteRecordedRide } = createRideArchive(AsyncStorage);
