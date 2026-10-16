import {Coord} from './types';import {GroupMember} from '../groups/model';
export interface MemoryLocation {riderId:string;at:number;coordinate:Coord;}
export interface MemoryMedia {id:string;riderId:string;mime:string;bytes:number;startedAt:number;endedAt?:number;}
export interface RideMemory {schema:1;id:string;startedAt:number;endedAt?:number;name:string;includeVideo:boolean;riders:{id:string;name:string}[];locationChunks:number;locations:number;media:MemoryMedia[];}
/** Missing permission from older clients is a denial, not implicit consent. */
export function memoryParticipants(members:readonly GroupMember[],selfId:string,now=Date.now()){return members.filter(m=>m.id!==selfId&&m.memoriesAllowed===true&&now-m.updatedAt<=60000);}
export function memoryLocation(member:GroupMember,previous?:MemoryLocation):MemoryLocation|null{if(!member.memoriesAllowed||!member.position||previous&&member.updatedAt<=previous.at)return null;if(previous&&member.updatedAt-previous.at<5000&&previous.coordinate.every((v,i)=>v===member.position![i]))return null;return {riderId:member.id,at:member.updatedAt,coordinate:[...member.position]};}
/** Validate stored identifiers before they can become native file paths. */
export const validMemoryId=(value:unknown):value is string=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(value);
export function readMemory(raw:unknown):RideMemory|null {
 const m=raw as RideMemory;
 if(!m||m.schema!==1||!validMemoryId(m.id)||!Number.isFinite(m.startedAt)||typeof m.name!=='string'||!Array.isArray(m.riders)||!Array.isArray(m.media)||!Number.isInteger(m.locationChunks)||m.locationChunks<0||m.locationChunks>100000||!Number.isInteger(m.locations)||m.locations<0)return null;
 if(m.riders.some(r=>!r||typeof r.id!=='string'||typeof r.name!=='string')||m.media.some(f=>!f||!validMemoryId(f.id)||typeof f.riderId!=='string'||typeof f.mime!=='string'||!/^((audio|video)\/(webm|mp4))([; ].*)?$/.test(f.mime)||!Number.isFinite(f.bytes)||f.bytes<0))return null;
 return m;
}
