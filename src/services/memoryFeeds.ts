import type {MediaStream as NativeMediaStream} from 'react-native-webrtc';
export type ReceiverStream=MediaStream|NativeMediaStream;
export interface MemoryFeed {id:string;audio?:ReceiverStream;video?:ReceiverStream;}
let feeds:MemoryFeed[]=[];const listeners=new Set<()=>void>();
export const subscribeMemoryFeeds=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};export const memoryFeeds=()=>feeds;
export function setMemoryFeed(id:string,kind:'audio'|'video',stream:ReceiverStream|null){const old=feeds.find(f=>f.id===id);if(old?.[kind]===stream||!old&&!stream)return;feeds=feeds.filter(f=>f.id!==id);const next={...old,id,[kind]:stream??undefined};if(next.audio||next.video)feeds=[...feeds,next];for(const fn of listeners)fn();}
