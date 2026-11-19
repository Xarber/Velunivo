import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountArchiveBytes, archiveEnabled, archiveKinds, projectAccountArchive, type AccountArchive, type ArchiveKind } from '../core/accountArchive';
import { hashCanonical } from '../core/canonicalHash';
import { exportAutomaticSync, importAccountArchive } from './automaticSync';
import { accountRequest } from './accountSession';
import { isRideLocked } from './rideLock';
import type { AccountStatus } from './accountSync';

const keyFor = (account: string, category: ArchiveKind) => `account-archive-v1:${account}:${category}`;
export async function archivePreferences(account: string) {
  const items = await AsyncStorage.multiGet(archiveKinds.map(category => keyFor(account, category)));
  return Object.fromEntries(archiveKinds.map((category, index) => [category, items[index]?.[1] ?? null])) as Record<ArchiveKind, string | null>;
}

async function categoryEnabled(status: AccountStatus, category: ArchiveKind, bytes: number) {
  const preference = await AsyncStorage.getItem(keyFor(status.account!, category));
  return archiveEnabled(category, bytes, preference, status.portableSync === true);
}

export async function setArchiveEnabled(status: AccountStatus, category: ArchiveKind, enabled: boolean) {
  if (status.account) await AsyncStorage.setItem(keyFor(status.account, category), enabled ? 'on' : 'off');
}

let sharingBinding: string | undefined;
const published = new Map<ArchiveKind, string>();

async function refreshSharedArchive(status: AccountStatus, category: ArchiveKind, archive: AccountArchive) {
  if (category !== 'saved-places' && category !== 'exploration') return;
  if (isRideLocked() || !await categoryEnabled(status, category, accountArchiveBytes(archive))) return;
  const digest = await hashCanonical(archive.value);
  if (published.get(category) === digest) return;
  await accountRequest(`archive/${category}/sharing`, { method: 'POST', headers: { 'X-Sync-Binding': status.binding! } });
  if (sharingBinding === status.binding) published.set(category, digest);
}

export async function syncAccountArchive(status: AccountStatus) {
  if (sharingBinding !== status.binding) { published.clear(); sharingBinding = status.binding; }
  if (!status.signedIn || !status.canSync || !status.account || !status.binding || isRideLocked()) return;
  const preferences = await archivePreferences(status.account);
  const selected = archiveKinds.filter(category => archiveEnabled(category, 0, preferences[category], status.portableSync === true));
  if (!selected.length || isRideLocked()) return;
  let local = await exportAutomaticSync(false);
  const headers = { 'X-Sync-Binding': status.binding };
  let failure: unknown;
  for (const category of selected) {
    try {
      if (isRideLocked()) return;
      let archive = projectAccountArchive(local, category);
      if (!await categoryEnabled(status, category, accountArchiveBytes(archive))) continue;
      const path = 'archive/' + category;
      let remote: { revision: number; data: AccountArchive } | null = null;
      try { remote = await (await accountRequest(path, { headers })).json(); }
      catch (error) {
        const statusCode = (error as Error).message;
        if (statusCode === '409') continue;
        if (statusCode !== '404') throw error;
      }
      if (isRideLocked() || !await categoryEnabled(status, category, accountArchiveBytes(archive))) continue;
      if (remote) {
        if (await hashCanonical(archive) === await hashCanonical(remote.data)) {
          await refreshSharedArchive(status, category, archive);
          continue;
        }
        const current: AccountStatus = await (await accountRequest('status')).json();
        if (current.binding !== status.binding) return;
        await importAccountArchive(remote.data, category);
        local = await exportAutomaticSync(false);
        archive = projectAccountArchive(local, category);
        if (await hashCanonical(archive) === await hashCanonical(remote.data)) {
          await refreshSharedArchive(status, category, archive);
          continue;
        }
      }
      if (isRideLocked() || !await categoryEnabled(status, category, accountArchiveBytes(archive))) continue;
      try {
        await accountRequest(path, {
          method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json', 'If-Match': `"${remote?.revision ?? 0}"` },
          body: JSON.stringify(archive),
        });
        await refreshSharedArchive(status, category, archive);
      } catch (error) {
        if ((error as Error).message !== '409') throw error;
      }
    } catch (error) { failure ??= error; }
  }
  if (failure) throw failure;
}
