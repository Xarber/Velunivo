import {clientPeerIdScript} from './peerIdentity';
import {peerRuntime} from './peerRuntime.generated';
import {peerOptions} from './peerOptions';
import {normalizeCode} from '../core/dataTransfer';
export function dataSyncHtml(role:'sender'|'receiver',code:string,options:typeof peerOptions|{debug:0}=peerOptions){return `<!doctype html><script>${peerRuntime.replace(/<\/script/gi,'<\\/script')}</script><script>
${clientPeerIdScript}
const emit=(type,value)=>window.ReactNativeWebView.postMessage(JSON.stringify({type,value}));let connection;const role=${JSON.stringify(role)},id=${JSON.stringify('velunivo-sync-'+normalizeCode(code))};
const peer=role==='sender'?new Peer(id,${JSON.stringify(options)}):new Peer(clientPeerId('sync'),${JSON.stringify(options)});
const attach=c=>{if(connection){c.on('open',()=>{c.send({type:'busy'});setTimeout(()=>c.close(),100);});return;}connection=c;c.on('open',()=>{clearTimeout(connectionTimer);emit('open');});c.on('data',value=>{if(value&&value.type==='busy')emit('error');else if(JSON.stringify(value).length<110000)emit('data',value);});c.on('error',()=>emit('error'));c.on('close',()=>emit('error'));};
window.sendPacket=p=>{if(connection&&connection.open)connection.send(p);};peer.on('open',()=>{if(role==='receiver')attach(peer.connect(id,{reliable:true,serialization:'json'}));});peer.on('connection',c=>role==='sender'?attach(c):c.close());peer.on('call',c=>c.close());peer.on('error',()=>emit('error'));const connectionTimer=setTimeout(()=>{if(role==='receiver'&&(!connection||!connection.open))emit('error');},15000);const timer=setTimeout(()=>{emit('error');peer.destroy();},600000);window.addEventListener('pagehide',()=>{clearTimeout(timer);clearTimeout(connectionTimer);peer.destroy();});
</script>`;}
