import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex,utf8ToBytes} from '@noble/hashes/utils.js';
import {DevicePair,validateDevicePair} from './devicePair';
export const MESH_LIMIT=5;
export interface MeshEdge {host:string;guest:string;pair:DevicePair;}
export interface DeviceMesh {schema:2;self:string;edges:MeshEdge[];revoked:Record<string,number>;}
export const deviceId=(s:string)=>bytesToHex(sha256(utf8ToBytes(s))).slice(0,32);
export const edgeId=(a:string,b:string)=>[a,b].sort().join(':');
const validId=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
/** Membership is the active connected component; a revoked device cannot recreate its links. */
export function meshMembers(m:DeviceMesh){const members=new Set([m.self]);let changed=true;while(changed){changed=false;for(const e of m.edges){if((m.revoked[edgeId(e.host,e.guest)]??-1)>=e.pair.pairedAt)continue;if(members.has(e.host)||members.has(e.guest)){for(const id of [e.host,e.guest])if(!members.has(id)){members.add(id);changed=true;}}}}return [...members];}
export function readMesh(raw:unknown):DeviceMesh|null{
 const m=raw as DeviceMesh;if(!m||m.schema!==2||!validId(m.self)||!Array.isArray(m.edges)||m.edges.length>64||!m.revoked||typeof m.revoked!=='object'||Array.isArray(m.revoked)||Object.keys(m.revoked).length>256)return null;
 if(Object.entries(m.revoked).some(([id,at])=>! /^[a-f0-9]{32}:[a-f0-9]{32}$/.test(id)||!Number.isFinite(at)||at<0))return null;
 const edges:MeshEdge[]=[];for(const e of m.edges){const pair=validateDevicePair(e.pair);if(!pair||!validId(e.host)||!validId(e.guest)||e.host===e.guest)return null;edges.push({host:e.host,guest:e.guest,pair:{...pair,role:'host'}});}
 const result={schema:2 as const,self:m.self,edges,revoked:{...m.revoked}};return meshMembers(result).length<=MESH_LIMIT?result:null;
}
export function migratePair(pair:DevicePair):DeviceMesh{const host=pair.hostDevice??deviceId(pair.secret+':host'),guest=pair.guestDevice??deviceId(pair.secret+':guest');return {schema:2,self:pair.role==='host'?host:guest,edges:[{host,guest,pair:{...pair,role:'host'}}],revoked:{}};}
/** Graph metadata travels only in authenticated, private-server channels. Original times survive gossip. */
export function mergeMesh(local:DeviceMesh,incoming:DeviceMesh):DeviceMesh{
 const revoked={...local.revoked};for(const [id,at] of Object.entries(incoming.revoked))revoked[id]=Math.max(at,revoked[id]??0);
 const edges=new Map<string,MeshEdge>();for(const edge of [...local.edges,...incoming.edges]){const id=edgeId(edge.host,edge.guest),old=edges.get(id);if(!old||edge.pair.pairedAt>old.pair.pairedAt||edge.pair.pairedAt===old.pair.pairedAt&&edge.pair.secret>old.pair.secret)edges.set(id,edge);}
 const merged={schema:2 as const,self:local.self,edges:[...edges.values()],revoked};if(meshMembers(merged).length>MESH_LIMIT)throw new Error('A maximum of five devices can be paired.');return merged;
}
export function meshPairs(m:DeviceMesh,includeRevoked=false){return m.edges.filter(e=>(e.host===m.self||e.guest===m.self)&&(includeRevoked||(m.revoked[edgeId(e.host,e.guest)]??-1)<e.pair.pairedAt)).map(e=>({...e.pair,role:(e.host===m.self?'host':'guest') as DevicePair['role'],hostDevice:e.host,guestDevice:e.guest}));}
export function completeMesh(m:DeviceMesh,randomSecret:()=>string,now:number):DeviceMesh{const members=meshMembers(m).sort(),edges=[...m.edges];for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){const a=members[i],b=members[j],id=edgeId(a,b);const existing=edges.find(e=>edgeId(e.host,e.guest)===id);if(existing&&(m.revoked[id]??-1)<existing.pair.pairedAt)continue;if(existing)edges.splice(edges.indexOf(existing),1);edges.push({host:a,guest:b,pair:{schema:1,secret:randomSecret(),role:'host',origin:m.edges[0]?.pair.origin||'',pairedAt:now,hostDevice:a,guestDevice:b}});}return {...m,edges};}
export function revokeMeshDevice(m:DeviceMesh,remote:string,now:number){const revoked={...m.revoked};for(const id of meshMembers(m))if(id!==remote)revoked[edgeId(id,remote)]=now;return {...m,revoked};}
