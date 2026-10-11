import {SHARE_ORIGIN} from './model';
import {peerServerOptions} from './hostConfig';
// Private signaling is preferred. serverSelection permits a disclosed Cloud fallback only after an outage check.
export const peerOptions=peerServerOptions(SHARE_ORIGIN,{host:process.env.EXPO_PUBLIC_PEER_HOST,port:process.env.EXPO_PUBLIC_PEER_PORT,path:process.env.EXPO_PUBLIC_PEER_PATH,secure:process.env.EXPO_PUBLIC_PEER_SECURE,ice:process.env.EXPO_PUBLIC_PEER_ICE_SERVERS});
