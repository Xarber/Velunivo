import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { Coord, Route } from './types';
const list = (v: any): any[] => v == null ? [] : Array.isArray(v) ? v : [v];
export function importGPX(xml: string, name = 'Imported track'): Route {
  if (xml.length > 5_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('GPX is too large or contains unsupported XML declarations.');
  if (XMLValidator.validate(xml) !== true) throw new Error('Invalid GPX XML.');
  const doc = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', removeNSPrefix: true }).parse(xml).gpx;
  if (!doc) throw new Error('This file has no GPX root.');
  const segments = list(doc.trk).flatMap(t => list(t.trkseg).map(s => list(s.trkpt)));
  const routes = list(doc.rte).map(r => list(r.rtept));
  // GraphHopper exports full track geometry alongside sparse route waypoints.
  // Prefer the continuous track; never concatenate the two representations.
  const tracks = segments.filter(s => s.length > 1);
  const nonempty = tracks.length ? tracks : routes.filter(s => s.length > 1);
  if (nonempty.length !== 1) throw new Error('Choose a GPX with one continuous track segment or route; disconnected segments cannot be joined safely.');
  const coordinates: Coord[] = nonempty[0].map(p => [Number(p.lon), Number(p.lat)]);
  if (coordinates.length > 20000 || coordinates.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 180 || Math.abs(y) > 85)) throw new Error('GPX contains invalid coordinates or too many points.');
  return { id: `gpx-${Date.now()}`, name, kind: 'track', coordinates, steps: [], details: {}, source: 'gpx', warnings: ['Track only: no turn instructions or road-access data.', 'ETA assumes your cruise speed; surface, hills and stops are unknown.'] };
}
export function exportGPX(points: Coord[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Velunivo" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>Velunivo ride</name><trkseg>${points.map(([lon, lat]) => `<trkpt lat="${lat}" lon="${lon}"/>`).join('')}</trkseg></trk></gpx>`;
}
