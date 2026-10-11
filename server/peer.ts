import {PeerServer} from 'peer';
// Bind privately; put behind HTTPS/WSS reverse proxy. No route/location storage.
PeerServer({host:process.env.PEER_BIND || '127.0.0.1',port:Number(process.env.PEER_PORT || 9000),path:'/peer',proxied:true,allow_discovery:false,concurrent_limit:250,expire_timeout:30000});
