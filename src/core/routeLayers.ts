import { Coord, Route } from './types';
import { routeLengths, pointAt } from './geo';
export const ROUTE_WIDTH = 8;
export const ROUTE_GREEN = '#28DAB0';
export const ROUTE_GRAY = '#A7AFBA';
export function routeLayers(routes: Route[], selected: Route | null, completedMeters?: number, trace?: Coord[][],accent=ROUTE_GREEN) {
  const trail=(trace || []).filter(segment=>segment.length>1).map((coordinates,i)=>({id:`travelled-trace-${i}`,coordinates,color:ROUTE_GRAY,outline:'#56616E'}));
  const alternatives = [...trail, ...routes.filter(r => r.id !== selected?.id).map(r => ({ id: `${r.id}-alternative`, coordinates: r.coordinates, color: ROUTE_GRAY, outline: '#56616E' }))];
  if (!selected) return alternatives;
  let ahead: Coord[] = selected.coordinates, behind: Coord[] = [];
  if (completedMeters !== undefined && completedMeters > 0) {
    const lengths = routeLengths(selected.coordinates), total = lengths.at(-1)!;
    const meters = Math.max(0, Math.min(total, completedMeters)), cut = pointAt(selected.coordinates, meters, lengths);
    const i = lengths.findIndex(d => d >= meters);
    behind = [...selected.coordinates.slice(0, Math.max(1, i)), cut];
    ahead = meters >= total ? [] : [cut, ...selected.coordinates.slice(Math.max(1, i))];
  }
  const split=selected.returnStartIndex;let returning:Coord[]=[];
  if(Number.isInteger(split)&&split!>0&&split!<selected.coordinates.length-1){const distance=routeLengths(selected.coordinates)[split!];if(completedMeters===undefined||completedMeters<distance){returning=selected.coordinates.slice(split!);const remaining=selected.coordinates.slice(0,split!+1);ahead=completedMeters&&completedMeters>0?[pointAt(selected.coordinates,completedMeters,routeLengths(selected.coordinates)),...remaining.slice(Math.max(1,routeLengths(selected.coordinates).findIndex(d=>d>=completedMeters)))]:remaining;}}
  return [...alternatives,...(returning.length>1?[{id:`${selected.id}-return`,coordinates:returning,color:ROUTE_GRAY,outline:'#56616E'}]:[]), ...(behind.length > 1 ? [{ id: `${selected.id}-completed`, coordinates: behind, color: ROUTE_GRAY, outline: '#56616E' }] : []), ...(ahead.length > 1 ? [{ id: `${selected.id}-selected`, coordinates: ahead, color: accent, outline: '#24383B' }] : [])];
}
