import {clientPeerIdScript} from './peerIdentity';
import {peerRuntime} from './peerRuntime.generated';
import {peerOptions} from './peerOptions';
export function nativePeerHtml(role:'host'|'viewer',pin:string,viewerId?:string,options:typeof peerOptions|{debug:0}=peerOptions){return `<!doctype html><meta name="viewport" content="width=device-width"><script>${peerRuntime.replace(/<\/script/gi,'<\\/script')}</script><script>
 ${clientPeerIdScript}
 const role=${JSON.stringify(role)},pin=${JSON.stringify(pin)},viewerId=${JSON.stringify(viewerId ?? null)};let peer,connections=[],route,progress,closed=false,lastSent=0,lastReceived=Date.now();
 // Literal JavaScript is intentional: Hermes function.toString() returns bytecode, not source.
 const presence=(()=>{const sent=new Map();return {mark:id=>sent.set(id,Date.now()),count:()=>{const now=Date.now();for(const [id,at] of sent)if(now-at>=60000)sent.delete(id);return sent.size;},clear:()=>sent.clear()};})();let viewerCount=-1;
 const report=()=>{if(role!=='host')return;const count=presence.count();if(count!==viewerCount){viewerCount=count;emit('viewers',count);}};
 const viewerKey=c=>typeof c.metadata?.viewerId==='string' && /^velunivo-viewer-[a-f0-9]{32}$/.test(c.metadata.viewerId)?c.metadata.viewerId:c.peer||c;
 const send=(c,m)=>{try{c.send(m);if(m.type==='progress'){presence.mark(viewerKey(c));report();}}catch(e){c.close();}};
 let presenceTimer,healthTimer;
 const emit=(type,value)=>window.ReactNativeWebView.postMessage(JSON.stringify({type,value}));
 const stop=(revoke=true)=>{if(closed)return;closed=true;clearTimeout(timer);clearInterval(presenceTimer);clearInterval(healthTimer);presence.clear();report();connections.forEach(c=>{if(revoke && role==='host'&&c.open)c.send({type:'ended'});c.close();});if(peer)peer.destroy();};
 const recover=()=>{if(closed)return;stop(false);emit('recover',true);};
 const reconnectSignaling=()=>{clearTimeout(timer);timer=setTimeout(recover,20000);try{peer.reconnect();}catch(e){recover();}};
 window.stopSharing=()=>stop(true);
 window.resume=()=>{emit('resumed',true);if(closed){emit('recover',true);return;}if(peer?.destroyed){recover();return;}if(peer?.disconnected)reconnectSignaling();if(role==='viewer' && (!connections.some(c=>c.open) || Date.now()-lastReceived>=30000))recover();};
 let timer=setTimeout(()=>{emit('status','Connection timed out. Retry when both devices are online.');recover();},20000);
 const attach=c=>{if(role==='host'){for(const old of [...connections])if(viewerKey(old)===viewerKey(c)){connections=connections.filter(x=>x!==old);old.close();}}if(connections.length>=8){c.close();return;}connections.push(c);c.on('open',()=>{if(closed || !connections.includes(c)){c.close();return;}if(role==='host'){if(route)send(c,route);if(progress)send(c,progress);}else{clearTimeout(timer);emit('ready',true);emit('status','Connected · waiting for location');}});if(role==='viewer')c.on('data',m=>{if(closed || !connections.includes(c))return;if(JSON.stringify(m).length>1000000)return;lastReceived=Date.now();emit('message',m);if(m.type==='ended'){emit('status','Trip sharing ended');stop();}});c.on('close',()=>{if(!connections.includes(c))return;connections=connections.filter(x=>x!==c);if(role==='viewer'&&!closed){emit('status','Rider disconnected · updates stopped');recover();}});c.on('error',()=>{c.close();if(role==='viewer'){emit('status','Connection lost · retry to reconnect');recover();}});};
 window.publish=m=>{if(role!=='host'||closed)return;if(m.type==='route'){if(JSON.stringify(route)===JSON.stringify(m))return;route=m;}if(m.type==='progress'){progress=m;if(m.progress.updatedAt-lastSent<5000)return;lastSent=m.progress.updatedAt;}connections.forEach(c=>{if(c.open)send(c,m);});};
 try{peer=role==='host'?new Peer('velunivo-'+pin,${JSON.stringify(options)}):new Peer(clientPeerId('viewer'),${JSON.stringify(options)});peer.on('open',()=>{if(closed)return;clearTimeout(timer);if(role==='host'){clearTimeout(timer);emit('ready',true);emit('status','Live trip sharing is on');}else if(!connections.length)attach(peer.connect('velunivo-'+pin,{reliable:true,serialization:'json',metadata:{viewerId}}));});peer.on('connection',c=>role==='host'&&!closed?attach(c):c.close());peer.on('call',c=>c.close());peer.on('error',()=>{if(closed)return;emit('status','Sharing connection unavailable. Retry when online.');recover();});peer.on('disconnected',()=>{if(!closed){emit('status','Signaling disconnected. Sharing may be interrupted.');reconnectSignaling();}});}catch(e){emit('status','Sharing unavailable on this device.');recover();}
 if(role==='host'){report();presenceTimer=setInterval(report,1000);}
 healthTimer=setInterval(()=>{if(peer?.destroyed || (role==='viewer' && Date.now()-lastReceived>=30000))recover();},5000);
 window.addEventListener('pagehide',()=>emit('suspended',true));window.addEventListener('pageshow',()=>window.resume());emit('loaded',true);
 </script>`;}
