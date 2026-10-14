import {hashCanonical} from '../core/canonicalHash';
import {canonicalJson} from '../core/canonicalJson';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {sha256} from '@noble/hashes/sha2.js';import {bytesToHex,utf8ToBytes} from '@noble/hashes/utils.js';
import {automaticMerge,AutomaticEnvelope,Revisions,syncItems} from '../core/automaticSync';
import {parseSyncEnvelope} from '../core/syncPrivateData';
import {exportSyncData,importSyncData} from './dataTransfer';
import {refreshAppData} from './dataChange';
const key='automatic-sync-revisions-v1';
const hash=(value:unknown)=>bytesToHex(sha256(utf8ToBytes(canonicalJson(value))));
export async function exportAutomaticSync():Promise<AutomaticEnvelope>{const data=await exportSyncData(true);let old:Revisions={};try{old=JSON.parse(await AsyncStorage.getItem(key)||'{}');}catch{}const revisions:Revisions={};for(const [id,item] of syncItems(data.backup)){const digest=await hashCanonical(item),previous=old[id];revisions[id]=previous?.hash===digest?previous:{hash:digest,modifiedAt:Date.now()};}await AsyncStorage.setItem(key,JSON.stringify(revisions));return {...data,revisions};}
export function automaticDigest(data:AutomaticEnvelope){return hash({items:syncItems(data.backup).sort(([a],[b])=>a<b?-1:a>b?1:0),settings:data.settings,privateData:data.privateData});}
export const automaticDigestAsync=(data:AutomaticEnvelope)=>hashCanonical({items:syncItems(data.backup).sort(([a],[b])=>a<b?-1:a>b?1:0),settings:data.settings,privateData:data.privateData});
export async function importAutomaticSync(text:string){const raw=JSON.parse(text) as AutomaticEnvelope,incoming=parseSyncEnvelope(text,true);const revisions=raw.revisions;if(!revisions||typeof revisions!=='object'||Object.entries(revisions).some(([id,v])=>id.length>250||!v||! /^[a-f0-9]{64}$/.test(v.hash)||!Number.isFinite(v.modifiedAt)||v.modifiedAt>Date.now()+300000))throw new Error('Invalid automatic sync revisions.');const local=await exportAutomaticSync(),combined=automaticMerge(local,{...incoming,revisions});if(await automaticDigestAsync(local)!==await automaticDigestAsync(combined)){await importSyncData(JSON.stringify(combined),'overwrite',true);await AsyncStorage.setItem(key,JSON.stringify(combined.revisions));refreshAppData();}}
