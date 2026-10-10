export type Coord = [number, number]; // longitude, latitude
export type RouteKind = 'bike' | 'car' | 'track';
export type Detail = [number, number, number | string];
export interface Step { text: string; sign: number; index: number; distance: number; }
export interface Route {
  id: string; name: string; kind: RouteKind; coordinates: Coord[];
  steps: Step[]; details: Record<string, Detail[]>; source: 'graphhopper' | 'valhalla' | 'gpx';
  startLabel?: string; endLabel?: string;
  safetyWarnings?: string[]; warnings: string[]; savedAt?: number; plannedCap?: number;
}
export interface Profile {
  name: string; maxSpeed: number; ridingLimit: number; cruiseFactor: number;
  acceleration: number; stopDelay: number; voice: boolean; motion: boolean; learnedSpeedKmh?: number; learnedRideCount?: number;
}
export const defaultProfile: Profile = {
  name: 'E-scooter', maxSpeed: 25, ridingLimit: 25, cruiseFactor: 0.8,
  acceleration: 0.8, stopDelay: 12, voice: true, motion: false,
};
export interface Fix { coordinate: Coord; accuracy: number; speed: number | null; heading?: number; timestamp: number; }

export interface Vehicle extends Profile { id: string; kind: 'escooter' | 'ebike'; rangeKm: number | null; rangeUnit: 'km' | 'mi'; icon: string; photo: string | null; photos?: string[]; }

export interface NavigationOptions { compass: boolean; tilted: boolean; unit: 'km' | 'mi'; voice: boolean; motion: boolean; volume: 'loud' | 'quiet' | 'off'; recordRides: boolean; downloadedMaps: boolean; developerMode: boolean; showSharingVehicle: boolean; learnedEta: boolean; transit: boolean; traffic: boolean; liveActivities: boolean; }
export const defaultNavigationOptions: NavigationOptions = { compass: true, tilted: false, unit: 'km', voice: true, motion: false, volume: 'loud', recordRides: true, downloadedMaps: true, developerMode: false, showSharingVehicle: true, learnedEta: true, transit: false, traffic: false, liveActivities: true };
