import type { NavigationOptions } from './types';
import type { SettingEdits } from './syncSettings';

export type AccountProfile = { name?: string; preferred_username?: string; hasPicture?: boolean };

export function accountReturnFailed(platform: string, browser?: { location?: { search?: string } }) {
  return platform === 'web' && new URLSearchParams(browser?.location?.search).get('account') === 'failed';
}

export function defaultAccountProfile(
  current: Pick<NavigationOptions, 'groupName' | 'groupPhoto'>,
  edits: SettingEdits,
  account: AccountProfile,
  photo?: string,
): Partial<Pick<NavigationOptions, 'groupName' | 'groupPhoto'>> | undefined {
  if (current.groupName.trim() || current.groupPhoto || edits['navigation.groupName'] || edits['navigation.groupPhoto']) {
    return undefined;
  }
  const name = [...(account.name?.trim() || account.preferred_username?.trim() || '')].slice(0, 40).join('');
  if (!name && !photo) return undefined;
  return { ...(name ? { groupName: name } : {}), ...(photo ? { groupPhoto: photo } : {}) };
}
