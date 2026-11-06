// SPDX-License-Identifier: AGPL-3.0-only
/** Publish consent only after every existing key has changed protection. Never deletes keys. */
export async function migrateCredentialProtection(previous:boolean,enabled:boolean,rewrite:(enabled:boolean)=>Promise<void>,commit:(enabled:boolean)=>Promise<void>){
 if(previous===enabled)return;
 try{await rewrite(enabled);await commit(enabled);}
 catch(error){await rewrite(previous);throw error;}
}
