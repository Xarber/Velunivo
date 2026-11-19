import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const idleSessionMilliseconds = 14 * 24 * 60 * 60 * 1000;
export type AccountSession = {
  subject: string;
  token: string;
  refreshToken?: string;
  accessExpiresAt: number;
  expiresAt: number;
  binding: string;
  profile: Record<string, string | boolean>;
  portableSync: boolean;
  canSync: boolean;
};

export function createAccountSessions(client: string, secret: string, directory?: string, now = Date.now) {
  const memory = new Map<string, AccountSession>();
  const refreshes = new Map<string, Promise<AccountSession | undefined>>();
  const key = directory && Buffer.from(hkdfSync('sha256', secret, client, 'velunivo-account-sessions-v1', 32));
  if (directory) mkdirSync(directory, { mode: 0o700, recursive: true });
  const path = (id: string) => join(directory!, createHash('sha256').update(id).digest('hex') + '.session');
  const validId = (id: string) => /^[a-f0-9]{64}$/.test(id);
  function erase(id: string) {
    if (directory && validId(id)) {
      try { unlinkSync(path(id)); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
  }
  function remove(id: string) {
    memory.delete(id);
    erase(id);
  }
  function get(id: string) {
    if (!validId(id)) return undefined;
    let value = memory.get(id);
    if (!value && key && !refreshes.has(id)) {
      let packed: Buffer | undefined;
      try { packed = readFileSync(path(id)); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      if (packed) {
        try {
          const decipher = createDecipheriv('aes-256-gcm', key, packed.subarray(0, 12));
          decipher.setAAD(Buffer.from(id));
          decipher.setAuthTag(packed.subarray(12, 28));
          value = JSON.parse(Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString());
        } catch { erase(id); }
      }
    }
    if (!value || value.expiresAt <= now()) {
      if (value) remove(id);
      return undefined;
    }
    memory.set(id, value);
    return value;
  }
  function save(id: string, value: AccountSession) {
    if (!validId(id)) throw new Error('Invalid account session key');
    for (const [priorId, session] of memory) if (session.expiresAt <= now()) remove(priorId);
    if (!memory.has(id) && memory.size >= 1024) throw new Error('Account session store is full');
    if (key && value.refreshToken) {
      const target = path(id);
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from(id));
      const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
      const tmp = target + '.' + randomBytes(8).toString('hex') + '.tmp';
      try {
        writeFileSync(tmp, Buffer.concat([iv, cipher.getAuthTag(), encrypted]), { mode: 0o600, flag: 'wx' });
        renameSync(tmp, target);
      } finally {
        try { unlinkSync(tmp); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      }
    }
    memory.set(id, value);
  }
  async function fresh(id: string, exchange: (refresh: string) => Promise<{ token: string; refreshToken?: string; expiresIn: number; canSync?: boolean }>) {
    const inFlight = refreshes.get(id);
    if (inFlight) return inFlight;
    const current = get(id);
    if (!current || !current.refreshToken || current.accessExpiresAt - now() >= 60_000) return current;
    const refreshToken = current.refreshToken;
    // Remove the durable old token before exchange. A crash or uncertain response cannot retry it.
    erase(id);
    const run = Promise.resolve().then(async () => {
      try {
        const next = await exchange(refreshToken);
        if (memory.get(id) !== current) return undefined;
        if (!next.refreshToken || next.refreshToken === refreshToken) {
          remove(id);
          return undefined;
        }
        const updated = {
          ...current, token: next.token, canSync: next.canSync ?? current.canSync, refreshToken: next.refreshToken,
          accessExpiresAt: now() + next.expiresIn * 1000, expiresAt: now() + idleSessionMilliseconds,
        };
        save(id, updated);
        return updated;
      } catch {
        if (memory.get(id) === current) remove(id);
        return undefined;
      } finally { refreshes.delete(id); }
    });
    refreshes.set(id, run);
    return run;
  }
  // Old encrypted envelopes are pruned by their last write time; access also checks actual expiry.
  if (directory) {
    for (const file of readdirSync(directory, { withFileTypes: true })) {
      if (!file.isFile() || !/^[a-f0-9]{64}\.session(?:\.[a-f0-9]{16}\.tmp)?$/.test(file.name)) continue;
      const target = join(directory, file.name);
      if (now() - statSync(target).mtimeMs >= idleSessionMilliseconds) unlinkSync(target);
    }
  }
  return { get, save, remove, fresh, persistent: !!key };
}
