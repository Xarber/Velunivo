import AsyncStorage from '@react-native-async-storage/async-storage';
export interface EntityEdit {modifiedAt:number;deleted?:boolean;}
const key='sync-entity-edits-v1';let pending=Promise.resolve();
export async function readEntityEdits():Promise<Record<string,EntityEdit>>{await pending.catch(()=>{});try{return JSON.parse(await AsyncStorage.getItem(key)||'{}');}catch{return {};}}
export function noteEntityEdit(id:string,deleted=false,at=Date.now()){pending=pending.catch(()=>{}).then(async()=>{let values:Record<string,EntityEdit>={};try{values=JSON.parse(await AsyncStorage.getItem(key)||'{}');}catch{}values[id]={modifiedAt:at,...(deleted?{deleted:true}:{})};await AsyncStorage.setItem(key,JSON.stringify(values));});return pending;}
