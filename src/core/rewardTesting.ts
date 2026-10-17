import {NavigationOptions} from './types';
export type TestCosmetics=Pick<NavigationOptions,'navigationArrow'|'locationPin'|'scratchStyle'|'profileBadge'|'profileBadges'>;
export interface RewardTestState {enabled:boolean;selection:Partial<TestCosmetics>;}
export const emptyRewardTest=():RewardTestState=>({enabled:false,selection:{}});
/** No persistence or network serialization. This allowlist deliberately excludes themes/photos. */
export function rewardTestSelection(state:RewardTestState,patch:Partial<NavigationOptions>):RewardTestState {if(!state.enabled)return state;const selection={...state.selection};for(const key of ['navigationArrow','locationPin','scratchStyle','profileBadge','profileBadges'] as const)if(patch[key]!==undefined)Object.assign(selection,{[key]:patch[key]});return {...state,selection};}
