import { randomBytes } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';

export const ARCHIVE_LIMIT = 8 * 1024 * 1024;
const CHUNK_SIZE = 42_000;
const MAX_PARTS = 48;
export const archiveCategories = new Set(['settings', 'vehicles', 'saved-places', 'saved-routes', 'recorded-rides', 'exploration']);

type StoredRecord = { revision: number; data: unknown; shared: boolean; public: boolean };
type Manifest = { generation: string; parts: number };

export class ArchiveError extends Error {
  constructor(readonly status: number) { super('Account archive request failed'); }
}

function manifest(value: unknown): Manifest {
  const data = value as Manifest;
  if (!data || typeof data.generation !== 'string' || !/^[a-f0-9]{32}$/.test(data.generation) ||
      !Number.isInteger(data.parts) || data.parts < 1 || data.parts > MAX_PARTS) throw new ArchiveError(502);
  return data;
}

export function archiveParts(value: unknown) {
  const raw = Buffer.from(JSON.stringify(value));
  if (raw.length > ARCHIVE_LIMIT) throw new ArchiveError(413);
  const packed = gzipSync(raw);
  const parts = Array.from({ length: Math.ceil(packed.length / CHUNK_SIZE) }, (_, i) =>
    packed.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE).toString('base64'));
  if (parts.length > MAX_PARTS) throw new ArchiveError(413);
  return parts;
}

export function restoreArchiveParts(parts: unknown[]) {
  if (!parts.length || parts.length > MAX_PARTS || parts.some(part =>
    typeof part !== 'string' || part.length > CHUNK_SIZE * 4 / 3 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(part))) throw new ArchiveError(502);
  return JSON.parse(gunzipSync(Buffer.concat(parts.map(part => Buffer.from(part as string, 'base64'))), {
    maxOutputLength: ARCHIVE_LIMIT,
  }).toString());
}

export function accountArchive(issuer: string, clientId: string, token: string, category: string, fetcher = fetch) {
  const base = `${issuer}/v1/apps/${clientId}/data/velunivo-${category}`;
  async function fetchRecord(method: string, id: string, revision?: number, data?: unknown) {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (revision !== undefined) headers['If-Match'] = `"${revision}"`;
    let body: string | undefined;
    if (method === 'PUT') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ data, public: false, readers: [] });
    }
    const response = await fetcher(`${base}/${id}`, { method, headers, body, redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (method === 'GET' && response.status === 404) return null;
    if (response.status === 409) {
      const detail = await response.json().catch(() => ({}));
      if (detail.error === 'App storage quota exceeded.') throw new ArchiveError(413);
    }
    if (!response.ok) throw new ArchiveError([401, 403, 409, 413, 422].includes(response.status) ? response.status : 503);
    if (method === 'DELETE') return null;
    const record: StoredRecord = await response.json();
    if (method === 'GET' && (record.shared !== false || record.public !== false)) throw new ArchiveError(502);
    return record;
  }
  const partId = (generation: string, index: number) => `${generation}-${index}`;
  const cleanup = async (generation: string, count: number) => {
    for (let offset = 0; offset < count; offset += 4) {
      await Promise.allSettled(Array.from({ length: Math.min(count - offset, 4) }, (_, index) =>
        fetchRecord('DELETE', partId(generation, offset + index), 1)));
    }
  };
  return {
    async read() {
      const record = await fetchRecord('GET', 'current');
      if (!record) return null;
      const current = manifest(record.data);
      const parts: unknown[] = [];
      for (let i = 0; i < current.parts; i += 4) {
        const group = await Promise.all(Array.from({ length: Math.min(current.parts - i, 4) }, (_, index) =>
          fetchRecord('GET', partId(current.generation, i + index))));
        if (group.some(part => !part)) throw new ArchiveError(409);
        parts.push(...group.map(part => part?.data));
      }
      return { revision: record.revision, data: restoreArchiveParts(parts) };
    },
    async write(revision: number, data: unknown) {
      const prior = await fetchRecord('GET', 'current');
      if ((prior?.revision ?? 0) !== revision) throw new ArchiveError(409);
      const previous = prior && manifest(prior.data);
      const parts = archiveParts(data);
      const generation = randomBytes(16).toString('hex');
      let result: StoredRecord | null;
      try {
        for (let i = 0; i < parts.length; i++) await fetchRecord('PUT', partId(generation, i), 0, parts[i]);
        result = await fetchRecord('PUT', 'current', revision, { generation, parts: parts.length });
      } catch (error) {
        // A timeout may occur after the provider commits the pointer.
        const committed = await fetchRecord('GET', 'current').catch(() => undefined);
        if (committed !== undefined && (!committed || manifest(committed.data).generation !== generation)) {
          await cleanup(generation, parts.length);
        }
        throw error;
      }
      if (previous) await cleanup(previous.generation, previous.parts);
      return { revision: result?.revision };
    },
    async remove(revision: number) {
      const prior = await fetchRecord('GET', 'current');
      if (!prior || prior.revision !== revision) throw new ArchiveError(409);
      const previous = manifest(prior.data);
      await fetchRecord('DELETE', 'current', revision);
      await cleanup(previous.generation, previous.parts);
    },
  };
}
