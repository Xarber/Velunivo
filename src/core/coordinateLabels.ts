import {Coord} from './types';import {SavedPlace} from './places';import {nearestSavedPlace} from './tripNames';
export const coordinateText=(c:Coord)=>`${c[1].toFixed(6)}, ${c[0].toFixed(6)}`;
/** Saved names win; unavailable/offline geocoding leaves the exact coordinates intact. */
export async function resolveCoordinateLabel(c:Coord,places:SavedPlace[],reverse:(c:Coord)=>Promise<string|undefined>,timeoutMs=10000){const saved=nearestSavedPlace(c,places);if(saved)return saved.name;let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([reverse(c).then(label=>label||coordinateText(c)),new Promise<string>(resolve=>{timer=setTimeout(()=>resolve(coordinateText(c)),timeoutMs);})]);}catch{return coordinateText(c);}finally{clearTimeout(timer);}}
