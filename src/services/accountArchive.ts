import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountArchiveBytes, archiveEnabled, archiveKinds, projectAccountArchive, type AccountArchive, type ArchiveKind } from '../core/accountArchive';
import { hashCanonical } from '../core/canonicalHash';
import { exportAutomaticSync, importAccountArchive } from './automaticSync';
import { accountRequest } from './accountSession';
import { isRideLocked } from './rideLock';
import type { AccountStatus } from './accountSync';

const keyFor = (account: string, category: ArchiveKind) => `account-archive-v1:${account}:${category}`;
export type ArchiveSize = { category: ArchiveKind; bytes: number; enabled: boolean };

async function categoryEnabled(status: AccountStatus, category: ArchiveKind, bytes: number) {
  const preference = await AsyncStorage.getItem(keyFor(status.account!, category));
  return archiveEnabled(category, bytes, preference, status.portableSync === true);
}

export async function accountArchiveSizes(status: AccountStatus): Promise<ArchiveSize[]> {
  if (!status.signedIn || !status.account) return [];
  const snapshot = await exportAutomaticSync(false);
  return Promise.all(archiveKinds.map(async category => {
    const bytes = accountArchiveBytes(projectAccountArchive(snapshot, category));
    return { category, bytes, enabled: await categoryEnabled(status, category, bytes) };
  }));
}

export async function setArchiveEnabled(status: AccountStatus, category: ArchiveKind, enabled: boolean) {
  if (status.account) await AsyncStorage.setItem(keyFor(status.account, category), enabled ? 'on' : 'off');
}

export async function syncAccountArchive(status: AccountStatus) {
  if (!status.signedIn || !status.account || !status.binding || isRideLocked()) return;
  let local = await exportAutomaticSync(false);
  const headers = { 'X-Sync-Binding': status.binding };
  let failure: unknown;
  for (const category of archiveKinds) {
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
        if (await hashCanonical(archive) === await hashCanonical(remote.data)) continue;
        const current: AccountStatus = await (await accountRequest('status')).json();
        if (current.binding !== status.binding) return;
        await importAccountArchive(remote.data, category);
        local = await exportAutomaticSync(false);
        archive = projectAccountArchive(local, category);
        if (await hashCanonical(archive) === await hashCanonical(remote.data)) continue;
      }
      if (isRideLocked() || !await categoryEnabled(status, category, accountArchiveBytes(archive))) continue;
      try {
        await accountRequest(path, {
          method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json', 'If-Match': `"${remote?.revision ?? 0}"` },
          body: JSON.stringify(archive),
        });
      } catch (error) {
        if ((error as Error).message !== '409') throw error;
      }
    } catch (error) { failure ??= error; }
  }
  if (failure) throw failure;
}
