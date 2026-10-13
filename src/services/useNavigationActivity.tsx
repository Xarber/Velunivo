import {ActivityTestKind} from '../core/activityTestData';
import { ActivityReport } from '../core/activityDiagnostics';
import { NavigationActivity } from '../core/liveActivity';
export function useNavigationActivity(_active: boolean, _props: NavigationActivity) { return { status: 'Live Activities require iOS.' }; }

export async function updateRideActivity(..._args: unknown[]) {}
export async function markActivityPaused() {}

export function inspectLiveActivity():ActivityReport {return {checks:null,activeCount:null,lastError:''};}

export async function startTestLiveActivity(_kind:ActivityTestKind='navigation',_overrides:Partial<NavigationActivity>={}):Promise<ActivityReport> {throw new Error('Live Activities require an iOS native build.');}
export async function stopTestLiveActivity() {}

export function useSpectatorActivity(_active:boolean,_props:NavigationActivity,_link:string){return {status:'Live Activities require a native build.'};}

export function useRecordingActivity(_active:boolean,_props:NavigationActivity){return {status:'Live Activities require a native build.'};}

export async function updateRecordingActivity(_props:NavigationActivity){}
