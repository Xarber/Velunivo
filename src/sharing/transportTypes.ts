import {TripMessage} from './model';
export interface TransportProps {forcePublic?:boolean;onServer?(publicServer:boolean):void;role:'host'|'viewer';pin:string;viewerId?:string;messages?:TripMessage[];onMessage?(m:TripMessage):void;onStatus(s:string):void;onReady?():void;onViewers?(count:number):void;}
