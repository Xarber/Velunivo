import {framedPeer} from './framedPeer';
import {Peer} from 'peerjs';
export async function loadPeerConstructor(){return framedPeer(Peer);}
