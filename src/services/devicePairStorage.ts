import * as SecureStore from 'expo-secure-store';
import {DevicePair,validateDevicePair} from '../core/devicePair';
const key='velunivo-device-pair-v1';
export async function readDevicePair(){try{return validateDevicePair(JSON.parse(await SecureStore.getItemAsync(key)||'null'));}catch{return null;}}
export async function writeDevicePair(pair:DevicePair|null){if(pair)await SecureStore.setItemAsync(key,JSON.stringify(pair));else await SecureStore.deleteItemAsync(key);}
