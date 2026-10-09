import { Coord, Route } from './types';
import { cumulative, pointAt } from './geo';
export const ROUTE_WIDTH = 8;
export const ROUTE_GREEN = '#28DAB0';
export const ROUTE_GRAY = '#A7AFBA';
export function routeLayers(routes: Route[], selected: Route | null, completedMeters?: number) {
  const alternatives = routes.filter(r => r.id !== selected?.id).map(r => ({ id: `${r.id}-alternative`, coordinates: r.coordinates, color: ROUTE_GRAY, outline: '#56616E' }));
  if (!selected) return alternatives;
  let ahead: Coord[] = selected.coordinates, behind: Coord[] = [];
  if (completedMeters !== undefined && completedMeters > 0) {
    const lengths = cumulative(selected.coordinates), total = lengths.at(-1)!;
    const meters = Math.max(0, Math.min(total, completedMeters)), cut = pointAt(selected.coordinates, meters);
    const i = lengths.findIndex(d => d >= meters);
    behind = [...selected.coordinates.slice(0, Math.max(1, i)), cut];
    ahead = meters >= total ? [] : [cut, ...selected.coordinates.slice(Math.max(1, i))];
  }
  return [...alternatives, ...(behind.length > 1 ? [{ id: `${selected.id}-completed`, coordinates: behind, color: ROUTE_GRAY, outline: '#56616E' }] : []), ...(ahead.length > 1 ? [{ id: `${selected.id}-selected`, coordinates: ahead, color: ROUTE_GREEN, outline: '#155E52' }] : [])];
}
