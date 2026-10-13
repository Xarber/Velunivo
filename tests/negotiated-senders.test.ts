import test from 'node:test';import assert from 'node:assert/strict';
import {negotiatedTransceiver} from '../src/groups/negotiatedSenders';
test('native answerer uses associated senders rather than unused pre-created transceivers',()=>{
 const track=(kind:string,mid:string|null,id:string)=>({mid,direction:'recvonly',receiver:{track:{kind}},sender:{id}});
 const initialAudio=track('audio',null,'unused-audio'),initialVideo=track('video',null,'unused-video'),audio=track('audio','0','negotiated-audio'),video=track('video','1','negotiated-video');
 const all=[initialVideo,initialAudio,audio,video];assert.equal(negotiatedTransceiver(all,'audio')?.sender.id,'negotiated-audio');assert.equal(negotiatedTransceiver(all,'video')?.sender.id,'negotiated-video');
 assert.equal(negotiatedTransceiver([initialAudio],'audio'),undefined);
});
