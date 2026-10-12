import {DevicePair} from '../core/devicePair';
import {readDevicePair,writeDevicePair} from './devicePairStorage';
export interface PairedState {pair:DevicePair|null;connected:boolean;syncing:boolean;status:string;lastSync?:number;incomingUnpair?:boolean;retrying?:boolean;lastError?:string;progress?:number;}
let state:PairedState={pair:null,connected:false,syncing:false,status:''};const listeners=new Set<()=>void>();
export const subscribeDevicePair=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export const getDevicePairState=()=>state;
export function updateDevicePairState(patch:Partial<PairedState>){state={...state,...patch};for(const fn of listeners)fn();}
export async function loadDevicePair(){const pair=await readDevicePair();updateDevicePairState({pair});return pair;}
export async function saveDevicePair(pair:DevicePair|null){await writeDevicePair(pair);updateDevicePairState({pair,connected:false,incomingUnpair:false});}
let unpairAction:(()=>void)|undefined,acceptAction:(()=>void)|undefined;
export function setUnpairActions(request:(()=>void)|undefined,accept?:(()=>void)){unpairAction=request;acceptAction=accept;}
export function requestDeviceUnpair(){unpairAction?.();}
export function acceptDeviceUnpair(){acceptAction?.();}

let retryAction:(()=>void)|undefined;
export function setDeviceSyncRetry(action:(()=>void)|undefined){retryAction=action;}
export function retryDeviceSync(){retryAction?.();}
