import {MapKeyEdit,writeMapKeyEdit} from './mapKeyRevision';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const loadMapSettings = async () => {};
export const hasMapKey = () => false;
export const downloadStyle = (): string | undefined => undefined;
// Kept for private cross-device sync; web map downloads remain unavailable.
export const getMapKey=async()=>await AsyncStorage.getItem('velunivo-synced-stadia-key')||'';
export const setMapKey=async(value:string,edit:MapKeyEdit|undefined={configured:true,modifiedAt:Date.now()})=>{if(value && !/^[a-zA-Z0-9_-]{10,200}$/.test(value))throw new Error('Check the Stadia Maps key.');if(value)await AsyncStorage.setItem('velunivo-synced-stadia-key',value);else await AsyncStorage.removeItem('velunivo-synced-stadia-key');await writeMapKeyEdit(edit);};
