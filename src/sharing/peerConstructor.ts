import {framedPeer} from './framedPeer';
/** Install native WebRTC before importing PeerJS: feature support is evaluated at module load. */
let ready:Promise<typeof import('peerjs').Peer>|undefined;
export function loadPeerConstructor(){return ready??=bootstrap().catch(e=>{ready=undefined;throw e;});}
async function bootstrap(){const rtc=await import('react-native-webrtc');rtc.registerGlobals();if(typeof navigator.userAgent!=='string')Object.defineProperty(navigator,'userAgent',{configurable:true,value:'Velunivo ReactNative WebRTC'});const {Peer}=await import('peerjs');return framedPeer(Peer);}
