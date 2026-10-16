import {diagnostic} from '../core/diagnosticEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {DevicePair} from '../core/devicePair';
import {DeviceMesh,migratePair,meshPairs,meshMembers,mergeMesh,completeMesh,revokeMeshDevice,edgeId,deviceId} from '../core/deviceMesh';
import {readDevicePair,writeDevicePair,readDeviceMesh,writeDeviceMesh} from './devicePairStorage';
export interface PairStatus {connected:boolean;syncing:boolean;status:string;lastSync?:number;incomingUnpair?:boolean;retrying?:boolean;lastError?:string;progress?:number;}
export interface PairedState extends PairStatus {names:Record<string,string>;pair:DevicePair|null;pairs:DevicePair[];mesh:DeviceMesh|null;links:Record<string,PairStatus>;notified:string[];}
const idle:PairStatus={connected:false,syncing:false,status:''};
let state:PairedState={...idle,names:{},pair:null,pairs:[],mesh:null,links:{},notified:[]};const listeners=new Set<()=>void>();let writes=Promise.resolve();let identityPromise:Promise<string>|undefined;
function publish(){for(const fn of listeners)fn();}
export const subscribeDevicePair=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export const getDevicePairState=()=>state;
export function updateDevicePairState(patch:Partial<PairedState>,secret?:string){if(patch.status!==undefined||patch.lastError)diagnostic('sync','state',{status:patch.status,connected:patch.connected,syncing:patch.syncing,error:patch.lastError});if(secret){state={...state,links:{...state.links,[secret]:{...idle,...state.links[secret],...patch}}};if(state.pair?.secret===secret)state={...state,...state.links[secret]};}else state={...state,...patch};publish();}
async function persist(mesh:DeviceMesh){await writeDeviceMesh(mesh);state={...state,mesh,pairs:meshPairs(mesh),pair:meshPairs(mesh).at(-1)??null};publish();}
function serialized(task:()=>Promise<void>){writes=writes.catch(()=>{}).then(task);return writes;}
export async function loadDevicePair(){try{const raw=JSON.parse(await AsyncStorage.getItem('paired-device-names-v1')||'{}');if(raw&&typeof raw==='object'&&!Array.isArray(raw))state={...state,names:Object.fromEntries(Object.entries(raw).filter(([id,name])=>/^[a-f0-9]{32}$/.test(id)&&typeof name==='string'&&name.length<=40)) as Record<string,string>};}catch{}const mesh=await readDeviceMesh(),legacy=mesh?null:await readDevicePair();if(mesh||legacy){await persist(mesh??migratePair(legacy!));if(legacy)await writeDevicePair(null);}return state.pair;}
async function createIdentity(){if(!state.mesh){const stored=await readDeviceMesh();if(stored)await persist(stored);else {const legacy=await readDevicePair();await persist(legacy?migratePair(legacy):{schema:2,self:deviceId(Array.from(Crypto.getRandomBytes(32)).join(',')),edges:[],revoked:{}});}}return state.mesh!.self;}
export function meshIdentity(){return identityPromise??=createIdentity().catch(error=>{identityPromise=undefined;throw error;});}
const randomSecret=()=>Array.from(Crypto.getRandomBytes(64),b=>b.toString(16).padStart(2,'0')).join('');
export async function saveDevicePair(pair:DevicePair|null){if(!pair){if(state.pair)await unpairMeshDevice(state.pair);return;}await meshIdentity();await serialized(async()=>{if(state.mesh!.edges.some(e=>e.pair.origin!==pair.origin))throw new Error('Reconnect to the private server used for pairing.');const next=migratePair(pair),merged=mergeMesh(state.mesh!,next);await persist(completeMesh(merged,randomSecret,Date.now()));await writeDevicePair(null);});}
export async function receiveDeviceMesh(incoming:DeviceMesh,origin:string){await serialized(async()=>{if(!state.mesh||incoming.edges.some(e=>e.pair.origin!==origin))return;const merged=mergeMesh(state.mesh,incoming);if(JSON.stringify(merged)===JSON.stringify(state.mesh))return;await persist(completeMesh(merged,randomSecret,Date.now()));});}
export const pairRevoked=(pair:DevicePair)=>!!(pair.hostDevice&&pair.guestDevice&&(state.mesh?.revoked[edgeId(pair.hostDevice,pair.guestDevice)]??-1)>=pair.pairedAt);
export function markRevocationNotified(pair:DevicePair){if(!state.notified.includes(pair.secret)){state={...state,notified:[...state.notified,pair.secret]};publish();}}
export async function unpairMeshDevice(pair:DevicePair){await serialized(async()=>{const m=state.mesh;if(!m)return;const remote=pair.role==='host'?pair.guestDevice:pair.hostDevice;if(!remote)return;await persist(revokeMeshDevice(m,remote,Date.now()));});}
export const meshSize=()=>state.mesh?meshMembers(state.mesh).length:1;
let unpairAction:(()=>void)|undefined,acceptAction:(()=>void)|undefined;
export function setUnpairActions(request:(()=>void)|undefined,accept?:(()=>void)){unpairAction=request;acceptAction=accept;}
export function requestDeviceUnpair(pair=state.pair){if(pair)void unpairMeshDevice(pair).catch(()=>updateDevicePairState({lastError:'Could not save the device change. Try again.',status:'Could not save the device change. Try again.'},pair.secret));else unpairAction?.();}
export function acceptDeviceUnpair(){acceptAction?.();}
const retryActions=new Map<string,()=>void>();
export function setDeviceSyncRetry(action:(()=>void)|undefined,secret='legacy'){if(action)retryActions.set(secret,action);else retryActions.delete(secret);}
export function retryDeviceSync(secret?:string){if(secret)retryActions.get(secret)?.();else for(const fn of retryActions.values())fn();}

export async function renamePairedDevice(pair:DevicePair,name:string){const id=pair.role==='host'?pair.guestDevice:pair.hostDevice;if(!id)return;const names={...state.names,[id]:name.trim().slice(0,40)};await AsyncStorage.setItem('paired-device-names-v1',JSON.stringify(names));state={...state,names};publish();}
