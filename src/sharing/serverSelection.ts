import {peerOptions} from './peerOptions';
export interface SelectedPeerServer {options:typeof peerOptions|{debug:0};publicServer:boolean;}
export const PUBLIC_SERVER_WARNING='Private server unavailable · using a public PeerJS server. Bluetooth credentials and API keys stay on this device.';
/** Only signaling-service outages trigger fallback. A missing peer or rejected code never does. */
export async function selectPeerServer(probe:typeof fetch=fetch,forcePublic=false):Promise<SelectedPeerServer>{
 if(forcePublic)return {options:{debug:0},publicServer:true};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{const url=`${peerOptions.secure?'https':'http'}://${peerOptions.host}:${peerOptions.port}${peerOptions.path.replace(/\/$/,'')}/peerjs/id?ts=${Date.now()}`;const response=await probe(url,{signal:controller.signal,cache:'no-store'});
 if(response.status>=500)return {options:{debug:0},publicServer:true};
 // 401/403/404 and malformed responses indicate configuration, not an outage.
 if(!response.ok)throw new ConfigurationError('Private PeerServer configuration is invalid.');
 const id=await response.text();if(!/^[A-Za-z0-9_-]{4,100}$/.test(id.trim()))throw new ConfigurationError('Private PeerServer configuration is invalid.');
 return {options:peerOptions,publicServer:false};
 }catch(e){if(e instanceof ConfigurationError)throw e;return {options:{debug:0},publicServer:true};}finally{clearTimeout(timer);}
}
class ConfigurationError extends Error{}
