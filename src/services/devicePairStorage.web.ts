import {DevicePair,validateDevicePair} from '../core/devicePair';
const key='velunivo-device-pair-v1';
export async function readDevicePair(){try{return validateDevicePair(JSON.parse(localStorage.getItem(key)||'null'));}catch{return null;}}
export async function writeDevicePair(pair:DevicePair|null){if(pair)localStorage.setItem(key,JSON.stringify(pair));else localStorage.removeItem(key);}
