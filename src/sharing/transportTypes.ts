import {TripMessage} from './model';
export interface TransportProps {role:'host'|'viewer';pin:string;viewerId?:string;messages?:TripMessage[];onMessage?(m:TripMessage):void;onStatus(s:string):void;onReady?():void;onViewers?(count:number):void;}
