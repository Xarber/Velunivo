import {useEffect,useRef} from 'react';
import type {MemoryFeed} from '../services/memoryFeeds';
import {openMemoryMedia,writeMemoryMedia,endMemoryMedia,memoryError,setMemoryStop} from '../services/memories';
export interface CaptureSource extends MemoryFeed {hear:boolean;see:boolean;}
function captureSource(source:CaptureSource,tracks:MediaStreamTrack[],video:boolean){
 const candidates=video?['video/webm;codecs=vp8,opus','video/webm','video/mp4']:['audio/webm;codecs=opus','audio/webm','audio/mp4'],mime=candidates.find(m=>MediaRecorder.isTypeSupported(m));
 if(!mime)throw new Error('Media recording is unavailable on this device. Locations are still saved.');
 const stream=new MediaStream(tracks);let closed=false,recorder:MediaRecorder|undefined,timer:ReturnType<typeof setTimeout>|undefined,resolve:()=>void=()=>{};const ended=new Promise<void>(r=>{resolve=r;});
 const segment=()=>{if(closed){resolve();return;}const id=openMemoryMedia(source.id,mime);if(!id){resolve();return;}const playback=document.createElement(video?'video':'audio');playback.srcObject=stream;playback.volume=0;playback.autoplay=true;if(playback instanceof HTMLVideoElement)playback.playsInline=true;playback.style.display='none';document.body.appendChild(playback);void playback.play().catch(()=>{});recorder=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:32000,videoBitsPerSecond:160000});let pending=Promise.resolve();
 recorder.ondataavailable=e=>{if(e.data.size)pending=pending.then(async()=>writeMemoryMedia(id,new Uint8Array(await e.data.arrayBuffer()))).catch(()=>memoryError('Some memory media could not be saved.'));};
 recorder.onstop=()=>{clearTimeout(timer);playback.srcObject=null;playback.remove();void pending.then(()=>endMemoryMedia(id)).finally(()=>{if(closed)resolve();else segment();});};
 recorder.onerror=()=>{closed=true;memoryError('Media recording was interrupted. Locations are still saved.');if(recorder?.state!=='inactive')recorder?.stop();else resolve();};recorder.start(5000);
 if(mime.includes('mp4'))timer=setTimeout(()=>{if(recorder?.state!=='inactive')recorder?.stop();},15000);
 };segment();return {stop:()=>{closed=true;clearTimeout(timer);if(recorder?.state!=='inactive')recorder?.stop();return Promise.race([ended,new Promise<void>(r=>setTimeout(r,15000))]);}};
}
export default function MemoryCapture({sources}:{sources:CaptureSource[]}){
 const recordings=useRef(new Map<string,{key:string;stop():Promise<void>}>());
 useEffect(()=>{let cancelled=false;const active=recordings.current;
 if(typeof MediaRecorder==='undefined'){memoryError('Media recording is unavailable on this device. Locations are still saved.');return;}
 const wanted=new Set(sources.map(s=>s.id));for(const [id,recording] of active)if(!wanted.has(id)){void recording.stop();active.delete(id);}
 for(const source of sources){const audio=source.hear&&source.audio instanceof MediaStream?source.audio.getAudioTracks().filter(t=>t.readyState==='live'):[],video=source.see&&source.video instanceof MediaStream?source.video.getVideoTracks().filter(t=>t.readyState==='live'):[],tracks=[...audio,...video],key=tracks.map(t=>t.id).join(':');if(active.get(source.id)?.key===key)continue;const previous=active.get(source.id);active.delete(source.id);void(async()=>{await previous?.stop();if(cancelled||!tracks.length)return;const deadline=Date.now()+15000;while(tracks.some(t=>t.muted)&&Date.now()<deadline&&!cancelled)await new Promise(resolve=>setTimeout(resolve,100));if(cancelled||tracks.some(t=>t.muted||t.readyState!=='live'))return;active.set(source.id,{key,...captureSource(source,tracks,video.length>0)});})().catch(()=>memoryError('Media recording was interrupted. Locations are still saved.'));}
 return()=>{cancelled=true;};},[sources]);
 useEffect(()=>{const active=recordings.current;const stop=async()=>{await Promise.all([...active.values()].map(r=>r.stop()));active.clear();};setMemoryStop(stop);return()=>{void stop();setMemoryStop(undefined);};},[]);return null;
}
