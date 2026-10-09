export type Coord = [number, number]; // longitude, latitude
export type RouteKind = 'bike' | 'car' | 'track';
export type Detail = [number, number, number | string];
export interface Step { text: string; sign: number; index: number; distance: number; }
export interface Route {
  id: string; name: string; kind: RouteKind; coordinates: Coord[];
  steps: Step[]; details: Record<string, Detail[]>; source: 'graphhopper' | 'gpx';
  warnings: string[]; savedAt?: number;
}
export interface Profile {
  name: string; maxSpeed: number; ridingLimit: number; cruiseFactor: number;
  acceleration: number; stopDelay: number; voice: boolean; motion: boolean;
}
export const defaultProfile: Profile = {
  name: 'My scooter', maxSpeed: 35, ridingLimit: 20, cruiseFactor: 0.8,
  acceleration: 0.8, stopDelay: 12, voice: true, motion: false,
};
export interface Fix { coordinate: Coord; accuracy: number; speed: number; timestamp: number; }
