import {saveDevicePair} from './devicePairState';
import {resetRoadPackCache} from './offlineRouting';
import {resetTransferIdentity} from './dataTransfer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {transferableKey} from '../core/dataStorage';
import {bluetoothBridge} from '../bluetooth/service';
import {associationStorage} from '../bluetooth/persistence';
import {setMapKey} from './mapSettings';
import {packs,deletePack} from './offline';
import {restoreGarage} from '../core/vehicles';
import {deletePhoto} from './vehiclePhotos';
import {refreshAppData} from './dataChange';
import {setLanguageChoice} from '../i18n/core';
/** Only Velunivo-owned storage and downloads. Call only after explicit in-app confirmation, outside a ride. */
export async function clearAppData(){
 await saveDevicePair(null);
 const garage=restoreGarage(await AsyncStorage.getItem('vehicles-v1'),null);
 await bluetoothBridge.disconnect();for(const a of await associationStorage.load())await bluetoothBridge.forget(a.vehicleId);await associationStorage.save([]);await setMapKey('');
 for(const pack of await packs())await deletePack(pack.id);
 const keys=(await AsyncStorage.getAllKeys()).filter(k=>transferableKey(k)||['welcome-seen-v1','release-seen-v1','portable-installation-id-v1','velunivo-web-ble-associations-v1','velunivo-synced-stadia-key'].includes(k)||['backup-files-v1','automatic-sync-revisions-v1'].includes(k)||k.startsWith('backup-file-v1:')||k.startsWith('offline-routing-v1'));
 await AsyncStorage.multiRemove(keys);
 for(const photo of new Set(garage.vehicles.flatMap(v=>[...(v.photos||[]),...(v.photo?[v.photo]:[])])))deletePhoto(photo);
 resetRoadPackCache();resetTransferIdentity();setLanguageChoice('system');refreshAppData();
}
