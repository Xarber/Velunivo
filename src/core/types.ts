export type Coord = [number, number]; // longitude, latitude
export type RouteKind = 'bike' | 'car' | 'track';
export type Detail = [number, number, number | string];
export interface Step { text: string; sign: number; index: number; distance: number; }
export interface Route {explorationBaseId?:string;
  returnStartIndex?:number;exploration?:boolean;id: string; name: string; kind: RouteKind; coordinates: Coord[];
  steps: Step[]; details: Record<string, Detail[]>; source: 'graphhopper' | 'valhalla' | 'gpx' | 'local-osm';
  waypoints?: import('./itinerary').RouteStop[]; elevation?:number[];
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
export interface Fix { speedSource?:'gps'|'estimated';rawSpeed?:number|null; altitude?:number; altitudeAccuracy?:number; coordinate: Coord; accuracy: number; speed: number | null; heading?: number; timestamp: number; }

export interface Vehicle extends Profile {energyCalibration?:import('./energyCalibration').EnergyCalibration;maintenance?:import('./maintenance').MaintenanceReminder[]; batteryWh?:number; totalMassKg?:number; energyReferenceSpeedKmh?:number; id: string; kind: 'escooter' | 'ebike'; rangeKm: number | null; learnedRangeKm?: number; learnedBatteryRideCount?: number; rangeUnit: 'km' | 'mi'; icon: string; photo: string | null; photos?: string[]; }

export interface NavigationOptions {locationPin?:"classic"|"halo"|"diamond";scratchStyle?:"soft"|"crisp";hideFromMemories:boolean;memoriesVideo:boolean;profileBadge:import('./cosmeticRewards').ProfileBadge;navigationArrow:import('./cosmeticRewards').NavigationArrow;debugLogs:boolean;cosmeticTheme:import('./explorationChallenges').CosmeticTheme;localNotifications:boolean;groupJoinApproval:boolean;navigationHaptics:boolean;batteryAwarePlanning:boolean;batteryReservePercent:number;assumedBatteryPercent:number;cyclingPreferencesVersion:number;planReturnTrip:boolean;batteryReturnPlaceId:string;preferBikeLanes:boolean;preferQuietRoads:boolean;preferFewerHills:boolean; scratchEnabled:boolean;scratchDisplay:import('./scratchMap').ScratchDisplay;explorationRoutes:boolean; groupVideo:boolean;groupName:string;groupPhoto?:string;groupPins:boolean;groupVoice:boolean; preferOfflineRouting:boolean; automaticRerouting: boolean; pedestrianLabel: boolean; speechVoice?: string; compass: boolean; tilted: boolean; unit: 'km' | 'mi'; voice: boolean; motion: boolean; volume: 'loud' | 'quiet' | 'off'; recordRides: boolean; askBatteryUsage: boolean; downloadedMaps: boolean; developerMode: boolean; showSharingVehicle: boolean; learnedEta: boolean; transit: boolean; traffic: boolean; liveActivities: boolean; backgroundNavigation: boolean; }
export const defaultNavigationOptions: NavigationOptions = {locationPin:'classic',scratchStyle:'soft',hideFromMemories:false,memoriesVideo:false,profileBadge:'none',navigationArrow:'classic',debugLogs:true,cosmeticTheme:'default',localNotifications:false,groupJoinApproval:false,navigationHaptics:true,batteryAwarePlanning:true,batteryReservePercent:15,assumedBatteryPercent:100,cyclingPreferencesVersion:1,planReturnTrip:false,batteryReturnPlaceId:'',preferBikeLanes:true,preferQuietRoads:true,preferFewerHills:false,scratchEnabled:true,scratchDisplay:'never',explorationRoutes:false,groupVideo:true,groupName:'',groupPins:true,groupVoice:false, preferOfflineRouting:false, automaticRerouting: true, pedestrianLabel: false, compass: true, tilted: false, unit: 'km', voice: true, motion: false, volume: 'loud', recordRides: true, askBatteryUsage: false, downloadedMaps: true, developerMode: false, showSharingVehicle: true, learnedEta: true, transit: false, traffic: false, liveActivities: true, backgroundNavigation: true };
