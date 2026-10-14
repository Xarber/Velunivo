import {Coord} from './types';
const cache=new WeakMap<Coord[],{latitude:number;longitude:number}[]>();
/** Geometry arrays produced by the route/scratch core are immutable snapshots. */
export function nativeCoordinates(points:Coord[]){let value=cache.get(points);if(!value){value=points.map(([longitude,latitude])=>({longitude,latitude}));cache.set(points,value);}return value;}
