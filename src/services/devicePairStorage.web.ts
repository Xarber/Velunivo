import {DeviceMesh,readMesh} from '../core/deviceMesh';
import {DevicePair,validateDevicePair} from '../core/devicePair';
const key='velunivo-device-pair-v1';
export async function readDevicePair(){try{return validateDevicePair(JSON.parse(localStorage.getItem(key)||'null'));}catch{return null;}}
export async function writeDevicePair(pair:DevicePair|null){if(pair)localStorage.setItem(key,JSON.stringify(pair));else localStorage.removeItem(key);}

export async function readDeviceMesh(){const raw=localStorage.getItem('velunivo-device-mesh-v2');if(!raw)return null;let value:DeviceMesh|null=null;try{value=readMesh(JSON.parse(raw));}catch{}if(!value)throw new Error('Saved device connections could not be read.');return value;}
export async function writeDeviceMesh(mesh:DeviceMesh){localStorage.setItem('velunivo-device-mesh-v2',JSON.stringify(mesh));}
