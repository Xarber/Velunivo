import {Coord,Route} from '../core/types';
import {validCoordinate} from '../sharing/model';
export const GROUP_LIMIT=8, MEMBER_LEASE=60000;
export interface RiderProfile {id:string;name:string;photo?:string;voice:boolean;}
export interface GroupMember extends RiderProfile {order:number;position:Coord|null;updatedAt:number;}
export interface GroupSnapshot {code:string;leader:string;revision:number;members:GroupMember[];banned:string[];route:Route|null;}
export type VoiceSignal={type:'offer'|'answer';sdp:string}|{type:'ice';candidate:{candidate:string;sdpMid:string|null;sdpMLineIndex:number|null}};
export type GroupMessage={type:'hello';profile:RiderProfile}|{type:'snapshot';snapshot:GroupSnapshot}|{type:'presence';profile:RiderProfile;position:Coord|null;at:number}|{type:'leave';id:string}|{type:'kick';id:string}|{type:'signal';signal:VoiceSignal};
export const GROUP_CODE=/^[A-Z0-9]{8}$/;
export const RIDER_ID=/^[a-f0-9]{32}$/;
export function formatGroupCode(value:string){const code=value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);return code.length>4?code.slice(0,4)+'-'+code.slice(4):code;}
export const compactGroupCode=(value:string)=>value.toUpperCase().replace(/-/g,'');
export const riderInitials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(s=>Array.from(s)[0]).join('').toUpperCase()||'?';
export function readProfile(raw:unknown):RiderProfile|null{const p=raw as RiderProfile;if(!p||!RIDER_ID.test(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>40||typeof p.voice!=='boolean'||p.photo!=null&&(typeof p.photo!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.photo)||p.photo.length>40000))return null;return {id:p.id,name:p.name.trim(),voice:p.voice,...(p.photo?{photo:p.photo}:{})};}
export function groupRoute(route:Route):Route|null{
 if(!route||typeof route!=='object'||!Array.isArray(route.coordinates)||route.coordinates.length<2||route.coordinates.length>20000||!route.coordinates.every(validCoordinate)||!Array.isArray(route.steps)||route.steps.length>2000)return null;
 const steps=route.steps.filter(s=>s&&typeof s.text==='string'&&Number.isInteger(s.index)&&s.index>=0&&s.index<route.coordinates.length&&Number.isFinite(s.distance)&&s.distance>=0&&Number.isFinite(s.sign)).map(s=>({text:s.text.slice(0,300),index:s.index,distance:s.distance,sign:s.sign}));
 return {id:String(route.id).slice(0,150),name:String(route.name).slice(0,200),kind:'track',source:'gpx',coordinates:route.coordinates.map(p=>[p[0],p[1]]),steps,waypoints:route.waypoints?.filter(s=>s&&validCoordinate(s.coordinate)&&typeof s.label==='string').slice(0,12).map(s=>({coordinate:s.coordinate,label:s.label.slice(0,200)})),details:{},warnings:['Group route · check road access and local rules.'],startLabel:String(route.startLabel??'Ride start').slice(0,200),endLabel:String(route.endLabel??'Destination').slice(0,200)};
}
export function readSnapshot(raw:unknown):GroupSnapshot|null{
 const s=raw as GroupSnapshot;if(!s||!GROUP_CODE.test(s.code)||!RIDER_ID.test(s.leader)||!Number.isSafeInteger(s.revision)||s.revision<0||!Array.isArray(s.members)||s.members.length<1||s.members.length>GROUP_LIMIT||!Array.isArray(s.banned)||s.banned.length>128||!s.banned.every(id=>RIDER_ID.test(id)))return null;
 const members:GroupMember[]=[];for(const m of s.members){const profile=readProfile(m);if(!profile||!Number.isSafeInteger(m.order)||m.order<0||!Number.isFinite(m.updatedAt)||m.updatedAt<0||m.position!==null&&!validCoordinate(m.position))return null;members.push({...profile,order:m.order,position:m.position,updatedAt:m.updatedAt});}
 if(new Set(members.map(m=>m.id)).size!==members.length||new Set(members.map(m=>m.order)).size!==members.length||!members.some(m=>m.id===s.leader)||members.some(m=>s.banned.includes(m.id)))return null;
 const route=s.route===null?null:groupRoute(s.route);if(s.route!==null&&!route)return null;
 return {code:s.code,leader:s.leader,revision:s.revision,members:members.sort((a,b)=>a.order-b.order),banned:[...s.banned],route};
}
export function readGroupMessage(raw:unknown):GroupMessage|null{
 if(!raw||typeof raw!=='object')return null;const m=raw as GroupMessage;
 if(m.type==='hello'){const profile=readProfile(m.profile);return profile?{type:'hello',profile}:null;}
 if(m.type==='snapshot'){const snapshot=readSnapshot(m.snapshot);return snapshot?{type:'snapshot',snapshot}:null;}
 if(m.type==='presence'){const profile=readProfile(m.profile);return profile&&(m.position===null||validCoordinate(m.position))&&Number.isFinite(m.at)&&m.at>=0?{type:'presence',profile,position:m.position,at:m.at}:null;}
 if((m.type==='leave'||m.type==='kick')&&RIDER_ID.test(m.id))return {type:m.type,id:m.id};
 if(m.type==='signal'){const s=m.signal;if(!s||typeof s!=='object')return null;if((s.type==='offer'||s.type==='answer')&&typeof s.sdp==='string'&&s.sdp.length<=100000)return {type:'signal',signal:{type:s.type,sdp:s.sdp}};if(s.type==='ice'&&s.candidate&&typeof s.candidate.candidate==='string'&&s.candidate.candidate.length<4000&&(s.candidate.sdpMid===null||typeof s.candidate.sdpMid==='string'&&s.candidate.sdpMid.length<100)&&(s.candidate.sdpMLineIndex===null||Number.isInteger(s.candidate.sdpMLineIndex)))return {type:'signal',signal:s};}
 return null;
}
export function admitRider(s:GroupSnapshot,profile:RiderProfile,now:number):GroupSnapshot|null{if(s.banned.includes(profile.id))return null;if(s.members.some(m=>m.id===profile.id))return {...s,members:s.members.map(m=>m.id===profile.id?{...m,...profile,updatedAt:now}:m)};if(s.members.length>=GROUP_LIMIT)return null;return {...s,revision:s.revision+1,members:[...s.members,{...profile,order:Math.max(...s.members.map(m=>m.order))+1,position:null,updatedAt:now}]};}
export function removeRider(s:GroupSnapshot,id:string,kicked=false):GroupSnapshot|null{const members=s.members.filter(m=>m.id!==id);if(!members.length)return null;return {...s,revision:s.revision+1,members,leader:s.leader===id?members.reduce((a,b)=>a.order<b.order?a:b).id:s.leader,banned:kicked?[...new Set([...s.banned,id])].slice(-128):s.banned};}
export function successor(s:GroupSnapshot,lastSeen:Map<string,number>,now:number){return s.members.filter(m=>now-(lastSeen.get(m.id)??0)<MEMBER_LEASE).sort((a,b)=>a.order-b.order)[0]?.id;}
