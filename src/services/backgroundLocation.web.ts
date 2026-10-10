import type { LocationObject } from 'expo-location';
import { Fix } from '../core/types';
export async function beginBackgroundLocation(_accept:(fix:Fix)=>Promise<void>,_error:(message:string)=>void,_isCancelled?:()=>boolean):Promise<()=>Promise<void>> {throw new Error('Web navigation requires keeping the page open.');}

export function locationFix(p: LocationObject): Fix {return {coordinate:[p.coords.longitude,p.coords.latitude],accuracy:p.coords.accuracy ?? 999,speed:p.coords.speed !== null && p.coords.speed >= 0 ? p.coords.speed : null,heading:p.coords.heading !== null && p.coords.heading >= 0 ? p.coords.heading : undefined,timestamp:p.timestamp};}
