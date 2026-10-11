import {useEffect,useRef} from 'react';
import {createSession,PeerSession} from './PeerSession';
import {TransportProps} from './transportTypes';
export default function PeerTransport({role,pin,messages,onMessage,onStatus,onReady}:TransportProps){
 const session=useRef<PeerSession|null>(null),latest=useRef({onMessage,onStatus,onReady,messages});useEffect(()=>{latest.current={onMessage,onStatus,onReady,messages};},[onMessage,onStatus,onReady,messages]);
 useEffect(()=>{let disposed=false;void createSession(role,pin,{status:s=>latest.current.onStatus(s),message:m=>latest.current.onMessage?.(m),ready:()=>latest.current.onReady?.()}).then(s=>{if(disposed)s.close();else{session.current=s;if(latest.current.messages)latest.current.messages.forEach(m=>s.publish(m));}}).catch(()=>latest.current.onStatus('Sharing unavailable on this browser.'));return()=>{disposed=true;session.current?.close();session.current=null;};},[role,pin]);
 useEffect(()=>{messages?.forEach(m=>session.current?.publish(m));},[messages]);return null;
}
