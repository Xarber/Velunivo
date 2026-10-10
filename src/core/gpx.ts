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

// Recorded fixes retain timestamps and sensor provenance in a namespaced extension.
export function exportRecordedGPX(samples: import('./recordings').RideSample[]) {
  const points = samples.filter(s => s.pathFix !== null && s.fix.accuracy >= 0 && s.fix.accuracy <= 35);
  let previous = 0;
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Velunivo" xmlns="http://www.topografix.com/GPX/1/1" xmlns:v="https://github.com/Xarber/Velunivo"><trk><name>Velunivo recorded ride</name><trkseg>${points.map(s => {
    const f = s.pathFix || s.fix, gap = s.breakBefore || (s.pathFix === undefined && previous && f.timestamp - previous > 15000) ? '</trkseg><trkseg>' : ''; previous = f.timestamp;
    const vector = (tag: string, v: import('./recordings').VectorReading | null) => v ? `<v:${tag} x="${v.x}" y="${v.y}" z="${v.z}" timestamp="${v.timestamp}"/>` : '';
    return `${gap}<trkpt lat="${f.coordinate[1]}" lon="${f.coordinate[0]}"><time>${new Date(f.timestamp).toISOString()}</time><extensions><v:accuracy>${f.accuracy}</v:accuracy>${f.speed !== null ? `<v:speed>${f.speed}</v:speed>` : ''}${f.heading !== undefined ? `<v:course>${f.heading}</v:course>` : ''}${s.compass ? `<v:compass timestamp="${s.compass.timestamp}">${s.compass.heading}</v:compass>` : ''}${vector('accelerometer', s.accelerometer)}${vector('gyroscope', s.gyroscope)}</extensions></trkpt>`;
  }).join('')}</trkseg></trk></gpx>`;
}
