import AsyncStorage from '@react-native-async-storage/async-storage';
import {createBrowserAssociationStorage} from './browserAssociations';
// Browser-local association, separate from the native SecureStore and public sharing data.
export const associationStorage=createBrowserAssociationStorage(AsyncStorage);
