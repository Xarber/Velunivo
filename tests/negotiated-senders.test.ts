import test from 'node:test';import assert from 'node:assert/strict';
import {negotiatedTransceiver} from '../src/groups/negotiatedSenders';
test('native answerer uses associated senders rather than unused pre-created transceivers',()=>{
 const track=(kind:string,mid:string|null,id:string)=>({mid,direction:'recvonly',receiver:{track:{kind}},sender:{id}});
 const initialAudio=track('audio',null,'unused-audio'),initialVideo=track('video',null,'unused-video'),audio=track('audio','0','negotiated-audio'),video=track('video','1','negotiated-video');
 const all=[initialVideo,initialAudio,audio,video];assert.equal(negotiatedTransceiver(all,'audio')?.sender.id,'negotiated-audio');assert.equal(negotiatedTransceiver(all,'video')?.sender.id,'negotiated-video');
 assert.equal(negotiatedTransceiver([initialAudio],'audio'),undefined);
});

test('negotiated SDP mids identify a sender before a receiver track is exposed',()=>{const all=[{mid:'v0',direction:'sendrecv',receiver:{track:null},sender:{id:'video'}},{mid:'a0',direction:'sendrecv',receiver:{track:null},sender:{id:'audio'}}];const sdp='v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=mid:v0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=mid:a0\r\n';assert.equal(negotiatedTransceiver(all,'video',sdp)?.sender.id,'video');assert.equal(negotiatedTransceiver(all,'audio',sdp)?.sender.id,'audio');assert.equal(negotiatedTransceiver(all,'video',sdp.replace('m=video 9','m=video 0')),undefined);});
