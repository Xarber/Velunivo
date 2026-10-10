import { ActivityReport } from '../core/activityDiagnostics';
import { NavigationActivity } from '../core/liveActivity';
export function useNavigationActivity(_active: boolean, _props: NavigationActivity) { return { status: 'Live Activities require iOS.' }; }

export async function updateRideActivity(..._args: unknown[]) {}
export async function markActivityPaused() {}

export function inspectLiveActivity():ActivityReport {return {checks:null,activeCount:null,lastError:''};}
