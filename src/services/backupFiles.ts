import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppBackup,MAX_BACKUP,parseBackup} from '../core/dataTransfer';
import {exportAppData} from './dataTransfer';
export interface BackupFile {id:string;createdAt:number;bytes:number;chunks:number;}
const index='backup-files-v1',key=(id:string,n:number)=>`backup-file-v1:${id}:${n}`;
export async function backupFiles():Promise<BackupFile[]>{try{return JSON.parse(await AsyncStorage.getItem(index)||'[]');}catch{return [];}}
export async function createBackupFile(){const backup=await exportAppData(),text=JSON.stringify(backup),all=await backupFiles();if(all.reduce((n,b)=>n+b.bytes,0)+text.length>MAX_BACKUP)throw new Error('Remove an older backup before creating another.');const entry={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,createdAt:Date.now(),bytes:text.length,chunks:Math.ceil(text.length/500000)},parts:[string,string][]=Array.from({length:entry.chunks},(_,i)=>[key(entry.id,i),text.slice(i*500000,(i+1)*500000)]);try{await AsyncStorage.multiSet(parts);await AsyncStorage.setItem(index,JSON.stringify([entry,...all]));return entry;}catch(e){await AsyncStorage.multiRemove(parts.map(([k])=>k));throw e;}}
export async function readBackupFile(entry:BackupFile):Promise<AppBackup>{const parts=await AsyncStorage.multiGet(Array.from({length:entry.chunks},(_,i)=>key(entry.id,i)));if(parts.some(([,v])=>v===null))throw new Error('This backup is incomplete.');return parseBackup(parts.map(([,v])=>v).join(''));}
export async function deleteBackupFile(entry:BackupFile){await AsyncStorage.setItem(index,JSON.stringify((await backupFiles()).filter(b=>b.id!==entry.id)));await AsyncStorage.multiRemove(Array.from({length:entry.chunks},(_,i)=>key(entry.id,i)));}
