import { defaultNavigationOptions, NavigationOptions, Profile } from './types';
// Migrate the selected vehicle's former switches once; global values win thereafter.
export function restorePreferences(raw: string | null, legacy: Profile): NavigationOptions {
  let v: Partial<NavigationOptions> = {};
  try { const parsed = raw && JSON.parse(raw); if (parsed && typeof parsed === 'object') v = parsed; } catch { /* Defaults recover corrupt preferences. */ }
  return { ...defaultNavigationOptions, compass: v.compass !== false, tilted: v.tilted === true, unit: v.unit === 'mi' ? 'mi' : 'km', voice: typeof v.voice === 'boolean' ? v.voice : legacy.voice !== false, motion: typeof v.motion === 'boolean' ? v.motion : legacy.motion === true, volume: v.volume === 'quiet' || v.volume === 'off' ? v.volume : 'loud', recordRides: v.recordRides !== false, downloadedMaps: v.downloadedMaps !== false, developerMode: v.developerMode === true, showSharingVehicle: v.showSharingVehicle !== false, learnedEta: v.learnedEta !== false, transit: v.transit === true, traffic: v.traffic === true, liveActivities: v.liveActivities !== false };
}
