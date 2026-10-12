import {AreaBounds} from './mapArea';
/** Photon can return a named place without city/locality fields; never use a shop or street as a neighborhood. */
export function mapAreaName(data: unknown, bounds: AreaBounds): string | undefined {
 const properties = (data as {features?:{properties?:Record<string,unknown>}[]})?.features?.[0]?.properties;
 if (!properties) return;
 const text = (key:string) => typeof properties[key] === 'string' ? (properties[key] as string).trim() : '';
 const small = bounds[2]-bounds[0] < .08 && bounds[3]-bounds[1] < .06;
 const place = text('osm_key') === 'place';
 const name = place ? text('name') : '';
 const locality = text('district') || text('locality') || (['neighbourhood','suburb','quarter'].includes(text('osm_value')) ? name : '');
 const city = text('city') || (['city','town','village','municipality'].includes(text('osm_value')) ? name : '') || text('county') || text('state');
 return [...new Set([small ? locality : '',city,text('country')].filter(Boolean))].join(', ') || (place ? name : undefined);
}
export function mapAreaFallback(bounds:AreaBounds, label:string) { return `${label} · ${((bounds[1]+bounds[3])/2).toFixed(3)}, ${((bounds[0]+bounds[2])/2).toFixed(3)}`; }
