import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
import {Microphone} from '../src/groups/microphone';import {negotiatedTransceiver} from '../src/groups/negotiatedSenders';import * as videoQuality from '../src/groups/videoQuality';
import {VoiceFactory} from '../src/groups/voice';
test('iOS system call starts connecting for two participants, reports media connection, and ends when alone',async()=>{
 const states:boolean[]=[],calls:boolean[]=[],events=new Map<string,(body:unknown)=>void>();const previews:unknown[]=[];let captures=0,ended=0,stopped=0;
 const native={addListener:(name:string,listener:(body:unknown)=>void)=>{events.set(name,listener);return{remove:()=>events.delete(name)};},setGroupVoiceActive:async(active:boolean)=>{calls.push(active);},setGroupVoiceConnected:async(connected:boolean)=>{states.push(connected);},setGroupVoiceMuted:async()=>{}};
 const track={stop:()=>stopped++},stream={getTracks:()=>[track],getAudioTracks:()=>[track],getVideoTracks:()=>[track],toURL:()=>'local-stream'};
 const rtc={mediaDevices:{getUserMedia:async()=>{captures++;return stream;}}};
 const mocks:Record<string,unknown>={'./negotiatedSenders':{negotiatedTransceiver},'./videoQuality':videoQuality,'./microphone':{Microphone},'../sharing/peerOptions':{peerOptions:{}},'react-native':{Platform:{OS:'ios'}},'expo-modules-core':{requireOptionalNativeModule:(name:string)=>name==='VelunivoAudio'?native:null},'react-native-webrtc':rtc};
 const context={exports:{},require:(name:string)=>{assert(name in mocks,name);return mocks[name];},Date,Math};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/groups/voiceFactory.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
 const factory=await(context.exports as {voiceFactory:(listener:(type:string)=>void,onVideo:(id:string,feed:unknown)=>void,onLocal:(feed:unknown)=>void)=>Promise<VoiceFactory>}).voiceFactory(type=>{if(type==='ended')ended++;},()=>{},feed=>previews.push(feed));
 const media=await factory.media(true);assert.deepEqual(calls,[]);assert.equal(captures,0);await media.participants?.(1);assert.deepEqual(calls,[true]);assert.equal(states.at(-1),false);
 await media.connected?.(0,true);await media.idle?.();assert.deepEqual(calls,[true]);assert.equal(captures,0);
 await media.connected?.(1,false);assert.equal(states.at(-1),true);await media.muteSelf(false);assert.equal(captures,1);await media.muteSelf(true);assert.equal(stopped,1);
 await media.setVideo?.(true,['peer']);assert.equal(captures,2);assert.equal((previews.at(-1) as {url:string}).url,'local-stream');await media.setVideo?.(true,['peer']);assert.equal(captures,2,'local preview reuses the same capture');await media.setVideo?.(false,[]);assert.equal(previews.at(-1),null);await media.connected?.(0,true);assert.equal(states.at(-1),false);assert.equal(calls.at(-1),true);await media.participants?.(0);await media.idle?.();assert.equal(calls.at(-1),false);events.get('voiceCallEnded')?.({});assert.equal(ended,1);await factory.stop();assert.equal(calls.at(-1),false);assert.equal(events.size,0);
});
