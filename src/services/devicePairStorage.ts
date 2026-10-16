import * as Crypto from 'expo-crypto';
import {DeviceMesh,readMesh} from '../core/deviceMesh';
import * as SecureStore from 'expo-secure-store';
import {DevicePair,validateDevicePair} from '../core/devicePair';
const key='velunivo-device-pair-v1';
export async function readDevicePair(){try{return validateDevicePair(JSON.parse(await SecureStore.getItemAsync(key)||'null'));}catch{return null;}}
export async function writeDevicePair(pair:DevicePair|null){if(pair)await SecureStore.setItemAsync(key,JSON.stringify(pair));else await SecureStore.deleteItemAsync(key);}

const meshKey='velunivo-device-mesh-v2';
export async function readDeviceMesh(){
 const raw=await SecureStore.getItemAsync(meshKey);if(!raw)return null;
 let data:unknown;
 try{const index=JSON.parse(raw);if(index.schema===2)data=index;else{if(index.schema!==3||!Number.isInteger(index.parts)||index.parts<1||index.parts>128||! /^[a-f0-9-]{1,80}$/.test(index.generation))throw new Error();let text='';for(let i=0;i<index.parts;i++){const part=await SecureStore.getItemAsync(`${meshKey}.${index.generation}.${i}`);if(part===null)throw new Error();text+=part;}data=JSON.parse(text);}}catch{throw new Error('Saved device connections could not be read.');}
 const mesh=readMesh(data);if(!mesh)throw new Error('Saved device connections could not be read.');return mesh;
}
export async function writeDeviceMesh(mesh:DeviceMesh){
 const text=JSON.stringify(mesh),generation=Crypto.randomUUID(),parts=Math.ceil(text.length/1700);let old:{generation?:string;parts?:number}|undefined;try{old=JSON.parse(await SecureStore.getItemAsync(meshKey)||'null');}catch{}
 try{for(let i=0;i<parts;i++)await SecureStore.setItemAsync(`${meshKey}.${generation}.${i}`,text.slice(i*1700,(i+1)*1700));await SecureStore.setItemAsync(meshKey,JSON.stringify({schema:3,generation,parts}));}catch(error){for(let i=0;i<parts;i++)await SecureStore.deleteItemAsync(`${meshKey}.${generation}.${i}`).catch(()=>{});throw error;}
 if(old?.generation&&Number.isInteger(old.parts)&&old.parts!<=128)for(let i=0;i<old.parts!;i++)await SecureStore.deleteItemAsync(`${meshKey}.${old.generation}.${i}`).catch(()=>{});
}
