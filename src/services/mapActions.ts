import {useSyncExternalStore} from 'react';
export interface MapActions {owner:string;compass:boolean;tilted:boolean;follow:boolean;overview:boolean;hasOverview:boolean;search?:()=>void;settings?:()=>void;resume():void;toggleCompass():void;toggleTilt():void;showOverview():void;}
let actions:MapActions|null=null;const listeners=new Set<()=>void>();
export function setMapActions(value:MapActions|null,owner:string){if(!value&&actions?.owner!==owner)return;actions=value;for(const f of listeners)f();}
export function useMapActions(){return useSyncExternalStore(f=>{listeners.add(f);return()=>{listeners.delete(f);};},()=>actions,()=>null);}
