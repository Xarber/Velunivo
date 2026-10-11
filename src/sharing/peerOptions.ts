import {SHARE_ORIGIN} from './model';
import {peerServerOptions} from './hostConfig';
// Same-origin self-hosted signaling; never silently connects to PeerJS Cloud.
export const peerOptions=peerServerOptions(SHARE_ORIGIN,{host:process.env.EXPO_PUBLIC_PEER_HOST,port:process.env.EXPO_PUBLIC_PEER_PORT,path:process.env.EXPO_PUBLIC_PEER_PATH,secure:process.env.EXPO_PUBLIC_PEER_SECURE,ice:process.env.EXPO_PUBLIC_PEER_ICE_SERVERS});
