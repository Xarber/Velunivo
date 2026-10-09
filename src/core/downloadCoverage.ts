import { Coord } from './types';
export function coveredByDownload(regions: { percentage: number; bounds?: [number, number, number, number] }[], position?: Coord, coordinates?: Coord[]) {
  const targets = coordinates?.length ? coordinates : position ? [position] : [];
  return targets.length > 0 && regions.some(r => r.percentage >= 100 && r.bounds && targets.every(([x, y]) => x >= r.bounds![0] && y >= r.bounds![1] && x <= r.bounds![2] && y <= r.bounds![3]));
}
