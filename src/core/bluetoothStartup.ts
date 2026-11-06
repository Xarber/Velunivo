// SPDX-License-Identifier: AGPL-3.0-only
/** Secure storage may be unavailable during a locked-screen location relaunch.
 * Do not confuse that with an empty garage or throw away readable preferences. */
export async function readBluetoothStartup(readPreferences:()=>Promise<string|null>,loadAssociations:()=>Promise<void>){
 const [preferences,associations]=await Promise.allSettled([readPreferences(),loadAssociations()]);
 return {preferencesAvailable:preferences.status==='fulfilled',rawPreferences:preferences.status==='fulfilled'?preferences.value:null,associationsReady:associations.status==='fulfilled'};
}
export function wakeRegistrationDecision(enabled:boolean,associationsReady:boolean,associated:boolean):'stop'|'wait'|'arm'{
 if(!enabled)return 'stop';
 if(!associationsReady)return 'wait';
 return associated?'arm':'stop';
}
