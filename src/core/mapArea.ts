import {Coord} from './types';
import {distance} from './geo';
export type AreaBounds=[number,number,number,number];
export interface SelectionRect {x:number;y:number;width:number;height:number;}
export interface MapAreaSelection {rect:SelectionRect;onChange(bounds:AreaBounds):void;}
export function areaBounds(a:Coord,b:Coord):AreaBounds {const bounds:AreaBounds=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];if(!bounds.every(Number.isFinite)||bounds[0]<-180||bounds[2]>180||bounds[1]<-85||bounds[3]>85||bounds[0]===bounds[2]||bounds[1]===bounds[3])throw new Error('Choose a valid map area.');return bounds;}
export function validateArea(bounds:AreaBounds){if(bounds[2]-bounds[0]>.18||bounds[3]-bounds[1]>.12)throw new Error('Zoom in to select a smaller map area.');return areaBounds([bounds[0],bounds[1]],[bounds[2],bounds[3]]);}
export function areaDimensions(b:AreaBounds){const latitude=(b[1]+b[3])/2,longitude=(b[0]+b[2])/2;return {width:distance([b[0],latitude],[b[2],latitude]),height:distance([longitude,b[1]],[longitude,b[3]])};}
