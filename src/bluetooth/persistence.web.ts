import AsyncStorage from '@react-native-async-storage/async-storage';
import {createBrowserAssociationStorage} from './browserAssociations';
// Browser-local association, separate from the native SecureStore and public sharing data.
export const associationStorage=createBrowserAssociationStorage(AsyncStorage);

export async function lockedCredentialAccessEnabled(){return false;}
export async function setLockedCredentialAccess(_enabled:boolean){throw new Error('Locked credential access is available on iOS only.');}
