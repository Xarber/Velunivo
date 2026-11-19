import { utf8ToBytes } from '@noble/hashes/utils.js';
import type { AutomaticEnvelope, Revisions } from './automaticSync';

export const defaultArchiveBytes = 256 * 1024;
export const archiveKinds = ['settings', 'vehicles', 'saved-places', 'saved-routes', 'recorded-rides', 'exploration'] as const;
export type ArchiveKind = typeof archiveKinds[number];
export type AccountArchive = { schema: 1; category: ArchiveKind; value: unknown; revisions?: Revisions };

const entityPrefix: Partial<Record<ArchiveKind, string>> = {
  vehicles: 'vehicle:', 'saved-places': 'place:', 'saved-routes': 'route:', 'recorded-rides': 'ride:',
};

function scopedRevisions(category: ArchiveKind, revisions: Revisions): Revisions {
  const prefix = entityPrefix[category];
  return prefix ? Object.fromEntries(Object.entries(revisions).filter(([key]) => key.startsWith(prefix))) : {};
}

export function projectAccountArchive(source: AutomaticEnvelope, category: ArchiveKind): AccountArchive {
  const { garage, places, routes, rides, scratch, exploration } = source.backup;
  const sort = <T,>(items: T[], id: (item: T) => string) =>
    [...items].sort((a, b) => id(a) < id(b) ? -1 : id(a) > id(b) ? 1 : 0);
  const vehicles = sort(garage.vehicles, vehicle => vehicle.id);
  const values: Record<ArchiveKind, unknown> = {
    settings: safeAccountSettings(source.settings ?? {}),
    vehicles: { vehicles, activeId: vehicles[0]?.id },
    'saved-places': sort(places, place => place.id), 'saved-routes': sort(routes, route => route.id),
    'recorded-rides': sort(rides.filter(ride => ride.summary.status !== 'recording'), ride => ride.summary.id), exploration: { scratch, exploration },
  };
  return { schema: 1, category, value: values[category], revisions: scopedRevisions(category, source.revisions) };
}

export function applyAccountArchive(local: AutomaticEnvelope, remote: AccountArchive, category: ArchiveKind): AutomaticEnvelope {
  if (!remote || remote.schema !== 1 || remote.category !== category || remote.value == null) throw new Error('Invalid account data.');
  const backup = { ...local.backup };
  const result = { ...local, backup, revisions: { ...local.revisions, ...scopedRevisions(category, remote.revisions ?? {}) } };
  delete result.privateData;
  const value = remote.value;
  switch (category) {
    case 'settings': result.settings = {
      ...local.settings, ...safeAccountSettings(value as NonNullable<AutomaticEnvelope['settings']>),
    }; break;
    case 'vehicles': backup.garage = value as typeof backup.garage; break;
    case 'saved-places': backup.places = value as typeof backup.places; break;
    case 'saved-routes': backup.routes = value as typeof backup.routes; break;
    case 'recorded-rides': backup.rides = value as typeof backup.rides; break;
    case 'exploration': {
      const incoming = value as Pick<typeof backup, 'scratch' | 'exploration'>;
      backup.scratch = incoming.scratch;
      backup.exploration = incoming.exploration;
      break;
    }
  }
  return result;
}

export function archiveEnabled(category: ArchiveKind, bytes: number, preference: string | null, consent: boolean) {
  if (preference !== null) return preference === 'on';
  return consent && bytes < defaultArchiveBytes && category !== 'recorded-rides' && category !== 'exploration';
}

function safeAccountSettings(settings: NonNullable<AutomaticEnvelope['settings']>) {
  return Object.fromEntries(Object.entries(settings).filter(([key]) =>
    key !== 'navigation.developerMode' && key !== 'bluetooth.simulatorEnabled' &&
    !/sampleData|developer|simulat|token|apiKey|serverUrl/i.test(key)));
}

export const accountArchiveBytes = (archive: unknown) => utf8ToBytes(JSON.stringify(archive)).length;
