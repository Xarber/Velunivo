// SPDX-License-Identifier: AGPL-3.0-only
import {BridgeSnapshot} from '../types';
export const M365_CONTROL_PLUGIN='xiaomi-m365-v1';
export interface M365RideControls {unlockOnStart:boolean;lockOnFinish:boolean;}
export const defaultM365RideControls:M365RideControls={unlockOnStart:false,lockOnFinish:false};
export function restoreM365RideControls(raw:string|null):M365RideControls{try{const p=JSON.parse(raw||'{}');return {unlockOnStart:p.unlockOnStart===true,lockOnFinish:p.lockOnFinish===true};}catch{return {...defaultM365RideControls};}}
export function m365ControlsAvailable(s:BridgeSnapshot,id:string){return s.pluginId===M365_CONTROL_PLUGIN&&s.vehicleId===id&&s.state==='connected'&&!s.simulated&&!!s.capabilities?.commands.includes('lock');}
export function safeStationary(s:BridgeSnapshot,now=Date.now()){const r=s.fields.speed;return !!r&&r.source==='vehicle'&&r.unit==='m/s'&&typeof r.value==='number'&&Number.isFinite(r.value)&&r.value>=0&&r.value<=.15&&now-r.timestamp>=-1000&&now-r.timestamp<=3000;}
