import { cellToParent, getResolution, isValidCell } from 'h3-js';
import { ArchiveError, accountArchive } from './accountArchive';

export const offeredCollections = {
  'saved-places': 'saved-places',
  exploration: 'exploration-history',
} as const;
type ShareableArchive = keyof typeof offeredCollections;

export function sharesArchive(category: string): category is ShareableArchive {
  return Object.hasOwn(offeredCollections, category);
}

export function sharedAccountData(category: ShareableArchive, archive: unknown) {
  const source = archive as { schema?: number; category?: string; value?: unknown };
  if (source?.schema !== 1 || source.category !== category) throw new ArchiveError(422);

  if (category === 'saved-places') {
    if (!Array.isArray(source.value)) throw new ArchiveError(422);
    const places = source.value.flatMap(place => {
      if (typeof place?.id !== 'string' || typeof place.name !== 'string' || typeof place.address !== 'string' ||
          !Array.isArray(place.coordinate) || place.coordinate.length !== 2 ||
          !place.coordinate.every(Number.isFinite) || Math.abs(place.coordinate[0]) > 180 || Math.abs(place.coordinate[1]) > 90) return [];
      return [{ id: place.id, name: place.name, address: place.address, coordinate: place.coordinate }];
    });
    return { schema: 1, places };
  }

  const value = source.value as { scratch?: { tiles?: Record<string, unknown> } };
  if (!value || typeof value !== 'object') throw new ArchiveError(422);
  const cells = new Set<string>();
  let visitedTiles = 0;
  for (const cell of Object.keys(value.scratch?.tiles ?? {})) {
    if (!isValidCell(cell) || getResolution(cell) !== 10) continue;
    cells.add(cellToParent(cell, 7));
    visitedTiles++;
  }
  return { schema: 1, visitedTiles, resolution: 7, cells: [...cells].sort() };
}

export async function updateSharedArchive(issuer: string, clientId: string, token: string, category: ShareableArchive, fetcher = fetch) {
  const endpoint = `${issuer}/v1/apps/${clientId}/data/${offeredCollections[category]}/current`;
  async function request(method: string, revision?: number, body?: string) {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (revision !== undefined) headers['If-Match'] = `"${revision}"`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetcher(endpoint, { method, headers, body, redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (method === 'GET' && response.status === 404) return null;
    if (!response.ok) throw new ArchiveError([401, 403, 409, 413, 422].includes(response.status) ? response.status : 503);
    if (method !== 'GET') return null;
    const record = await response.json();
    if (record.shared !== false || record.public !== false || !Number.isSafeInteger(record.revision)) throw new ArchiveError(502);
    return record as { data: unknown; revision: number };
  }

  // Read the outgoing revision first. A simultaneous publisher cannot replace
  // a newer projection with data read before this compare-and-set revision.
  const current = await request('GET');
  const archive = await accountArchive(issuer, clientId, token, category, fetcher).read();
  if (!archive) {
    if (current) await request('DELETE', current.revision);
    return;
  }
  const data = sharedAccountData(category, archive.data);
  const body = JSON.stringify({ data, public: false, readers: [] });
  if (Buffer.byteLength(body) > 58_000) throw new ArchiveError(413);
  if (JSON.stringify(current?.data) !== JSON.stringify(data)) await request('PUT', current?.revision ?? 0, body);
}
