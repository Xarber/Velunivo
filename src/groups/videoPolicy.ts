import {NavigationOptions} from '../core/types';
import {GroupMember} from './model';
export const allowsGroupVideo=(n:Pick<NavigationOptions,'developerMode'|'groupVideo'|'groupPins'|'groupVoice'>)=>n.developerMode&&n.groupVideo&&n.groupPins&&n.groupVoice;
export const videoRecipients=(members:GroupMember[],selfId:string,enabled:boolean)=>enabled?members.filter(m=>m.id!==selfId&&m.video===true&&m.voice).map(m=>m.id):[];
