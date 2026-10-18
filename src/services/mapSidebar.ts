import {useSyncExternalStore} from 'react';
let attached=false;const listeners=new Set<()=>void>();export function setMapSidebarAttached(value:boolean){if(value===attached)return;attached=value;for(const fn of listeners)fn();}export function useMapSidebarAttached(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>attached,()=>false);}
