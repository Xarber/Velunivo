import {TripMessage} from './model';
export interface TransportProps {role:'host'|'viewer';pin:string;messages?:TripMessage[];onMessage?(m:TripMessage):void;onStatus(s:string):void;onReady?():void;}
