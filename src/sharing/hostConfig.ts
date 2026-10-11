export const DEFAULT_SHARE_ORIGIN='https://velunivo.xcenter.it';
export function resolveShareOrigin(configured?:string,webOrigin?:string){
 const u=new URL(configured || webOrigin || DEFAULT_SHARE_ORIGIN);
 const local=['localhost','127.0.0.1','[::1]'].includes(u.hostname);
 if((u.protocol!=='https:' && !(local&&u.protocol==='http:'))||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('Sharing server must be an HTTPS origin (HTTP localhost is allowed for development).');
 return u.origin;
}
export function peerServerOptions(origin:string,override:{host?:string;port?:string;path?:string;secure?:string;ice?:string}={}){
 const url=new URL(origin),secure=override.secure?override.secure!=='false':url.protocol==='https:';
 const port=Number(override.port || url.port || (secure?443:80));
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PeerServer port');
 const path=override.path || '/peer';if(!path.startsWith('/')||path.includes('?'))throw new Error('Invalid PeerServer path');
 const config=override.ice?{iceServers:JSON.parse(override.ice)}:undefined;
 return {host:override.host || url.hostname,port,path,secure,...(config?{config}:{}),debug:0 as const};
}
