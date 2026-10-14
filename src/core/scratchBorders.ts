import {Coord} from './types';
import {ScratchGeometry} from './scratchMap';
const keys=new WeakMap<Coord[],string>();
function borderKey(ring:Coord[]){let key=keys.get(ring);if(key===undefined){key=ring.slice(0,-1).map(c=>c.map(n=>n.toFixed(7)).join(',')).sort().join(';');keys.set(ring,key);}return key;}
/** Borders are rendered once, after every fog fill, including enclosed islands. */
export function scratchBorders(geometry:ScratchGeometry){const seen=new Set<string>();return {type:'FeatureCollection' as const,features:geometry.features.flatMap(f=>f.geometry.coordinates.flatMap((ring,i)=>{if(f.id==='unexplored'&&i===0)return [];const key=borderKey(ring);if(seen.has(key))return [];seen.add(key);return [{type:'Feature' as const,id:`border-${f.id}-${i}`,properties:{highlight:f.properties.highlight},geometry:{type:'LineString' as const,coordinates:ring}}];}))};}
