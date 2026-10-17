import {readEntityEdits} from './entityEdits';
import {hashCanonical} from '../core/canonicalHash';
import {canonicalJson} from '../core/canonicalJson';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {sha256} from '@noble/hashes/sha2.js';import {bytesToHex,utf8ToBytes} from '@noble/hashes/utils.js';
import {automaticMerge,AutomaticEnvelope,Revisions,syncItems,syncDigestPayload} from '../core/automaticSync';
import {parseSyncEnvelope} from '../core/syncPrivateData';
import {installationId,exportSyncData,importSyncData} from './dataTransfer';
import {refreshAppData} from './dataChange';
const key='automatic-sync-revisions-v1';
const hash=(value:unknown)=>bytesToHex(sha256(utf8ToBytes(canonicalJson(value))));
async function exportInternal(allowPrivate=true):Promise<AutomaticEnvelope>{const data=await exportSyncData(allowPrivate),edits=await readEntityEdits(),installation=await installationId();let old:Revisions={};try{old=JSON.parse(await AsyncStorage.getItem(key)||'{}');}catch{}const revisions:Revisions={...old};const present=new Set<string>();for(const [id,item] of syncItems(data.backup)){present.add(id);const digest=await hashCanonical(item),previous=old[id],edit=edits[id]??edits[id.replace('vehicle:vehicle-'+installation+'-','vehicle:')];const intrinsic='summary' in item?item.summary.endedAt??item.summary.lastFixAt??item.summary.startedAt:'savedAt' in item?item.savedAt??0:0;revisions[id]=previous?.hash===digest&&!previous.deleted?previous:{hash:digest,modifiedAt:edit?.modifiedAt??previous?.modifiedAt??intrinsic??0};}for(const [id,v] of Object.entries(old))if(!present.has(id)&&!v.deleted&&id!=='vehicle:sharing-scooter')revisions[id]={...v,deleted:true,modifiedAt:edits[id]?.modifiedAt??Date.now()};for(const [id,edit] of Object.entries(edits))if(edit.deleted){const portable=id.startsWith('vehicle:default-scooter')||id.startsWith('vehicle:legacy-vehicle')?id.replace('vehicle:','vehicle:vehicle-'+installation+'-'):id;if(!present.has(portable)&&(!revisions[portable]||edit.modifiedAt>=revisions[portable].modifiedAt))revisions[portable]={hash:'0'.repeat(64),modifiedAt:edit.modifiedAt,deleted:true};}await AsyncStorage.setItem(key,JSON.stringify(revisions));return {...data,revisions};}

export function automaticDigest(data:AutomaticEnvelope){return hash(syncDigestPayload(data));}
export const automaticDigestAsync=(data:AutomaticEnvelope)=>hashCanonical(syncDigestPayload(data));
async function importInternal(text:string,allowPrivate=true,refresh=true){const raw=JSON.parse(text) as AutomaticEnvelope,incoming=parseSyncEnvelope(text,allowPrivate);const revisions=raw.revisions;if(!revisions||typeof revisions!=='object'||Object.entries(revisions).some(([id,v])=>id.length>250||!v||! /^[a-f0-9]{64}$/.test(v.hash)||!Number.isFinite(v.modifiedAt)||v.modifiedAt<0||v.deleted!==undefined&&typeof v.deleted!=='boolean'||v.modifiedAt>Date.now()+300000))throw new Error('Invalid automatic sync revisions.');const local=await exportInternal(allowPrivate),combined=automaticMerge(local,{...incoming,revisions});if(!allowPrivate)delete combined.privateData;if(await automaticDigestAsync(local)!==await automaticDigestAsync(combined)){await importSyncData(JSON.stringify(combined),'overwrite',allowPrivate);const stored=await exportSyncData(allowPrivate),anchored={...combined.revisions};for(const [id,item] of syncItems(stored.backup)){const revision=anchored[id];if(revision&&!revision.deleted)anchored[id]={...revision,hash:await hashCanonical(item)};}await AsyncStorage.setItem(key,JSON.stringify(anchored));if(refresh)refreshAppData();}}

let operation:Promise<unknown>=Promise.resolve();
function serialize<T>(fn:()=>Promise<T>):Promise<T>{const result=operation.catch(()=>{}).then(fn);operation=result;return result;}
export const exportAutomaticSync=(allowPrivate=true)=>serialize(()=>exportInternal(allowPrivate));
export const importAutomaticSync=(text:string,allowPrivate=true,refresh=true)=>serialize(()=>importInternal(text,allowPrivate,refresh));
