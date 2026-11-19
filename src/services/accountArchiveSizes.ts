import AsyncStorage from '@react-native-async-storage/async-storage';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import type { ArchiveKind } from '../core/accountArchive';
import { restoreGarage } from '../core/vehicles';
import { portablePhotoExtraBytes } from './vehiclePhotos';

const bytes = (value: string | null) => value ? utf8ToBytes(value).length : 0;
async function storedBytes(keys: string[]) {
  let total = 0;
  for (let index = 0; index < keys.length; index += 24) {
    const entries = await AsyncStorage.multiGet(keys.slice(index, index + 24));
    for (const [, value] of entries) total += bytes(value);
    if (index + 24 < keys.length) await new Promise(resolve => setTimeout(resolve, 0));
  }
  return total;
}

export async function estimateArchiveBytes(category: ArchiveKind): Promise<number> {
  switch (category) {
    case 'settings':
      return storedBytes(['navigation-v1', 'ui-language-v1', 'bluetooth-preferences-v1', 'sync-setting-edits-v1']);
    case 'saved-places':
      return storedBytes(['places-v1']);
    case 'exploration':
      return storedBytes(['scratch-map-v1', 'exploration-progress-v1']);
    case 'vehicles': {
      const raw = await AsyncStorage.getItem('vehicles-v1');
      const garage = restoreGarage(raw, null);
      return bytes(raw) + garage.vehicles.reduce((total, {photo, photos}) =>
        total + (photo ? portablePhotoExtraBytes(photo) : 0) +
        (photos ?? []).reduce((sum, uri) => sum + portablePhotoExtraBytes(uri), 0), 0);
    }
    case 'saved-routes': {
      const ids = await AsyncStorage.getItem('route-library-ids-v2');
      return ids === null ? storedBytes(['routes-v1']) : storedBytes((JSON.parse(ids) as string[]).map(id => `route-library-v2:${id}`));
    }
    case 'recorded-rides': {
      const ids: string[] = JSON.parse(await AsyncStorage.getItem('ride-history-ids-v1') ?? '[]');
      let total = 0;
      for (let offset = 0; offset < ids.length; offset += 24) {
        const entries = await AsyncStorage.multiGet(ids.slice(offset, offset + 24).map(id => `ride-summary-v1:${id}`));
        for (const [, raw] of entries) {
          if (!raw) continue;
          const {id, status, chunks} = JSON.parse(raw);
          if (status === 'recording' || !Number.isInteger(chunks) || chunks < 0 || chunks > 10_000) continue;
          total += bytes(raw) + await storedBytes(Array.from({length: chunks}, (_, i) => `ride-samples-v1:${id}:${i}`));
        }
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      return total;
    }
  }
}
