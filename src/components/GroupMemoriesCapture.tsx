import React,{useEffect,useMemo,useState,useSyncExternalStore} from 'react';
import {useGroupRide} from '../groups/GroupProvider';
import {memoryParticipants} from '../core/memories';
import {subscribeMemories,getMemoryState,updateMemoryLocations,stopMemory,memoryError} from '../services/memories';
import {subscribeMemoryFeeds,memoryFeeds} from '../services/memoryFeeds';
import MemoryCapture from './MemoryCapture';

export default function GroupMemoriesCapture(){
 const group=useGroupRide(),state=useSyncExternalStore(subscribeMemories,getMemoryState,getMemoryState);
 const feeds=useSyncExternalStore(subscribeMemoryFeeds,memoryFeeds,memoryFeeds),[preparedPolicy,setPreparedPolicy]=useState('');
 const allowed=memoryParticipants(group.snapshot?.members??[],group.selfId);
 const allowedIds=JSON.stringify(allowed.map(m=>[m.id,m.voice,!!m.camera&&!!m.video]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
 const muted=group.muted.join(',');
 const sources=useMemo(()=>{
  const riders=JSON.parse(allowedIds) as [string,boolean,boolean][];
  return feeds.flatMap(feed=>{const rider=riders.find(m=>m[0]===feed.id);return rider?[{...feed,hear:group.connectedVoicePeers>0&&rider[1]&&!group.audioMuted&&!muted.split(',').includes(feed.id),see:rider[2]&&!!state.memory?.includeVideo}]:[];});
 },[feeds,allowedIds,muted,group.audioMuted,group.connectedVoicePeers,state.memory?.includeVideo]);
 // A child's effect can run before its parent's. Authorize storage first, including
 // a rider who opts in while their existing media stream is already available.
 const approvedSources=useMemo(()=>{
  const prefix=state.memory?.id+':',ids=preparedPolicy.startsWith(prefix)?preparedPolicy.slice(prefix.length).split(','):[];
  return sources.filter(source=>ids.includes(source.id));
 },[sources,preparedPolicy,state.memory?.id]);
 useEffect(()=>{
  let cancelled=false;
  if(state.memory&&!group.code)void stopMemory().catch(()=>memoryError('Memories could not be saved.'));
  else if(state.memory){
   const id=state.memory.id,members=group.snapshot?.members??[];
   void updateMemoryLocations(members,group.selfId).then(()=>{
    if(!cancelled)setPreparedPolicy(id+':'+members.filter(m=>m.id!==group.selfId&&m.memoriesAllowed===true).map(m=>m.id).sort().join(','));
   }).catch(()=>memoryError('Some memory media could not be saved.'));
  }
  return()=>{cancelled=true;};
 },[state.memory,group.code,group.snapshot,group.selfId]);
 return state.memory?<MemoryCapture sources={approvedSources}/>:null;
}
