import AsyncStorage from '@react-native-async-storage/async-storage';
export interface MapKeyEdit {configured:true;modifiedAt:number;}
const key='private-map-key-edit-v1';
export async function readMapKeyEdit():Promise<MapKeyEdit|undefined>{try{const raw=JSON.parse(await AsyncStorage.getItem(key)||'null');return raw?.configured===true&&Number.isFinite(raw.modifiedAt)&&raw.modifiedAt>=0?raw:undefined;}catch{return undefined;}}
export async function writeMapKeyEdit(value:MapKeyEdit|undefined){if(value)await AsyncStorage.setItem(key,JSON.stringify(value));else await AsyncStorage.removeItem(key);}
