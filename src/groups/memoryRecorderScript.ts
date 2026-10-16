/** Receiver-only local bridge. It never asks for a microphone, camera or network server. */
export const memoryRecorderHTML=String.raw`<!doctype html><html><meta name="viewport" content="width=device-width"><body><script>
const peers=new Map(),earlyIce=new Map();
const send=value=>window.ReactNativeWebView.postMessage(JSON.stringify(value));
function record(state,id,stream){
 if(state.closed)return;
 const video=stream.getVideoTracks().length>0,candidates=video?['video/webm;codecs=vp8,opus','video/webm','video/mp4']:['audio/webm;codecs=opus','audio/webm','audio/mp4'],mime=candidates.find(x=>MediaRecorder.isTypeSupported(x));
 if(!mime){send({type:'error',id});return;}
 const playback=document.createElement(video?'video':'audio');playback.srcObject=stream;playback.volume=0;playback.autoplay=true;playback.playsInline=true;document.body.appendChild(playback);void playback.play().catch(()=>{});state.playback=playback;
 const recorder=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:32000,videoBitsPerSecond:160000});state.recorder=recorder;send({type:'start',id,mime});
 recorder.ondataavailable=event=>{if(!event.data.size)return;state.pending=state.pending.then(()=>new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>{const value=String(reader.result);send({type:'data',id,data:value.slice(value.indexOf(';base64,')+8)});resolve();};reader.onerror=()=>{send({type:'error',id});resolve();};reader.readAsDataURL(event.data);}));};
 recorder.onstop=()=>{clearTimeout(state.timer);playback.srcObject=null;playback.remove();state.pending.then(()=>{send({type:'end',id,final:state.closed});if(state.closed){state.pc.close();peers.delete(id);}else record(state,id,stream);});};
 recorder.onerror=()=>{state.closed=true;send({type:'error',id});if(recorder.state!=='inactive')recorder.stop();};
 recorder.start(5000);
 // Some MP4 muxers retain data until stop. Bound the buffer with separate playable segments.
 if(mime.includes('mp4'))state.timer=setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();},15000);
}
async function command(m){
 if(m.type==='offer'){
  const pc=new RTCPeerConnection({iceServers:[]}),state={pc,recorder:null,pending:Promise.resolve(),closed:false,timer:null};peers.set(m.id,state);
  pc.onicecandidate=e=>{if(e.candidate)send({type:'ice',id:m.id,candidate:e.candidate.toJSON()});};
  pc.ontrack=e=>{if(state.recorder||state.closed||state.starting)return;state.starting=true;const stream=e.streams[0],deadline=Date.now()+15000;const wait=()=>{if(state.closed)return;if(stream?.getTracks().length&&stream.getTracks().every(t=>!t.muted&&t.readyState==='live')&&pc.connectionState==='connected'){record(state,m.id,stream);return;}if(Date.now()>deadline){send({type:'error',id:m.id});return;}setTimeout(wait,100);};wait();};
  await pc.setRemoteDescription(m.description);for(const candidate of earlyIce.get(m.id)||[])await pc.addIceCandidate(candidate);earlyIce.delete(m.id);const answer=await pc.createAnswer();await pc.setLocalDescription(answer);send({type:'answer',id:m.id,description:answer});return;
 }
 const p=peers.get(m.id);if(!p){if(m.type==='ice')earlyIce.set(m.id,[...(earlyIce.get(m.id)||[]),m.candidate].slice(-64));return;}
 if(m.type==='ice'){await p.pc.addIceCandidate(m.candidate);return;}
 if(m.type==='stop'){p.closed=true;clearTimeout(p.timer);if(p.recorder&&p.recorder.state!=='inactive')p.recorder.stop();else p.pending.then(()=>{send({type:'end',id:m.id,final:true});p.pc.close();peers.delete(m.id);});}
}
window.memoryCommand=m=>command(m).catch(()=>send({type:'error',id:m.id}));send({type:typeof MediaRecorder==='undefined'?'unsupported':'ready'});
</script></body></html>`;
