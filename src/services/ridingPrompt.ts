// SPDX-License-Identifier: AGPL-3.0-only
import {bluetoothBridge} from '../bluetooth/service';
import {m365ControlsAvailable,safeStationary} from '../bluetooth/plugins/m365ControlPolicy';
/** Only native widget interaction events call this; public deep links never write to the scooter. */
export async function handleRidingPromptLock(target:string){
 const match=/^ride-prompt:(lock|unlock):(.+)$/.exec(target);if(!match)return;
 const id=decodeURIComponent(match[2]),snapshot=bluetoothBridge.getSnapshot();
 if(!m365ControlsAvailable(snapshot,id)||!safeStationary(snapshot))throw new Error('Stop to use vehicle controls.');
 await bluetoothBridge.setLocked(id,match[1]==='lock');
}
