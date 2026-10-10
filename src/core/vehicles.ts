import { defaultProfile, Vehicle } from './types';
export interface Garage { vehicles: Vehicle[]; activeId: string; sharingPresetAdded?: boolean; }
export function createVehicle(kind: Vehicle['kind'], id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`): Vehicle {
  return { ...defaultProfile, id, kind, name: kind === 'ebike' ? 'E-bike' : 'E-scooter', rangeKm: null, rangeUnit: 'km', icon: kind === 'ebike' ? '🚲' : '🛴', photo: null, photos: [] };
}
export const sharingVehicle: Vehicle = { ...createVehicle('escooter', 'sharing-scooter'), name: 'Sharing E-Scooter', maxSpeed: 25, ridingLimit: 20 };
export const defaultGarage: Garage = { vehicles: [createVehicle('escooter', 'default-scooter'), sharingVehicle], activeId: 'default-scooter', sharingPresetAdded: true };
function validProfile(v: any) { return v && typeof v.name === 'string' && [['maxSpeed', 1, 60], ['ridingLimit', 1, 60], ['cruiseFactor', .2, 1], ['acceleration', .1, 4], ['stopDelay', 0, 120]].every(([key, min, max]) => Number.isFinite(v[key]) && v[key] >= Number(min) && v[key] <= Number(max)); }
export function validPhoto(x: unknown): x is string { return typeof x === 'string' && ((/^data:image\/(png|jpeg|webp);base64,/.test(x) && x.length <= 1400000) || /^velunivo-photo:\/\/[a-zA-Z0-9-]+\.jpg$/.test(x)); }
export function restoreGarage(raw: string | null, legacy: string | null): Garage {
  try {
    const g = raw && JSON.parse(raw);
    if (g && Array.isArray(g.vehicles)) {
      const seen = new Set<string>();
      const vehicles: Vehicle[] = g.vehicles.filter((v: any) => {
        if (!validProfile(v) || typeof v.id !== 'string' || seen.has(v.id) || !['escooter', 'ebike'].includes(v.kind)) return false;
        seen.add(v.id); return true;
      }).map((v: Vehicle) => ({ ...createVehicle(v.kind, v.id), ...v, voice: typeof v.voice === 'boolean' ? v.voice : true, motion: typeof v.motion === 'boolean' ? v.motion : false, rangeKm: Number.isFinite(v.rangeKm) && v.rangeKm! > 0 && v.rangeKm! <= 10000 ? v.rangeKm : null, rangeUnit: v.rangeUnit === 'mi' ? 'mi' : 'km', icon: typeof v.icon === 'string' && v.icon.length <= 32 && v.icon.trim() ? v.icon : v.kind === 'ebike' ? '🚲' : '🛴', photos: Array.from(new Set([...(Array.isArray(v.photos) ? v.photos : []), ...(v.photo ? [v.photo] : [])].filter(validPhoto))), photo: validPhoto(v.photo) ? v.photo : null, ...(v.id === sharingVehicle.id ? {maxSpeed:25,ridingLimit:20} : {}) }));
      if (vehicles.length) { if (vehicles.every(v=>v.id === sharingVehicle.id)) vehicles.unshift(createVehicle('escooter','default-scooter')); if (!vehicles.some(v => v.id === sharingVehicle.id)) vehicles.push(sharingVehicle); return { sharingPresetAdded: true, vehicles, activeId: vehicles.some(v => v.id === g.activeId) ? g.activeId : vehicles[0].id }; }
    }
  } catch { /* Recover the former single profile when possible. */ }
  try { const v = legacy && JSON.parse(legacy); if (validProfile(v)) { const vehicle = { ...createVehicle('escooter', 'legacy-vehicle'), ...v }; return { vehicles: [vehicle, sharingVehicle], activeId: vehicle.id, sharingPresetAdded: true }; } } catch { /* Fresh generic default. */ }
  return defaultGarage;
}
export function removeVehicle(g: Garage, id: string): Garage {
  if (id === sharingVehicle.id || g.vehicles.filter(v=>v.id !== sharingVehicle.id).length <= 1) return g;
  const vehicles = g.vehicles.filter(v => v.id !== id);
  return { ...g, vehicles, activeId: g.activeId === id ? vehicles[0].id : g.activeId };
}
export const rangeValue = (km: number, unit: Vehicle['rangeUnit']) => unit === 'mi' ? km / 1.609344 : km;
export const rangeKm = (value: number, unit: Vehicle['rangeUnit']) => unit === 'mi' ? value * 1.609344 : value;
export function batteryEstimate(meters: number, vehicle: Vehicle) {
  if (!vehicle.rangeKm || !Number.isFinite(meters) || meters < 0) return null;
  return { percent: meters / 1000 / vehicle.rangeKm * 100, remainingKm: Math.max(0, vehicle.rangeKm - meters / 1000), exceedsRange: meters / 1000 > vehicle.rangeKm };
}
export function batteryLabel(meters: number, vehicle: Vehicle) {
  const b = batteryEstimate(meters, vehicle);
  return b ? `≈${b.percent.toFixed(b.percent > 0 && b.percent < 1 ? 1 : 0)}% of full battery${b.exceedsRange ? ' · exceeds full-charge range' : ''}` : 'Add vehicle range for a battery estimate';
}
