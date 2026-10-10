import { TransformRequestManager, OfflineManager } from '@maplibre/maplibre-react-native';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
let key = '';
function applyKey() { if (key) TransformRequestManager.addUrlSearchParam({id:'velunivo-stadia',match:'^https://tiles\\.stadiamaps\\.com/',name:'api_key',value:key}); else TransformRequestManager.removeUrlSearchParam('velunivo-stadia'); }
export async function loadMapSettings() { if (Platform.OS !== 'web') { key = await SecureStore.getItemAsync('velunivo-stadia-key') || ''; applyKey(); if (key) await OfflineManager.setMaximumAmbientCacheSize(5_000_000); } }
export async function setMapKey(value: string) { if (Platform.OS === 'web') throw new Error('Configure download maps in the native app.'); const cleaned=value.trim(); if (cleaned && !/^[a-zA-Z0-9_-]{10,200}$/.test(cleaned)) throw new Error('Check the Stadia Maps key.'); if (cleaned) await SecureStore.setItemAsync('velunivo-stadia-key',cleaned); else await SecureStore.deleteItemAsync('velunivo-stadia-key'); key=cleaned; applyKey(); if (key) await OfflineManager.setMaximumAmbientCacheSize(5_000_000); }
export function hasMapKey() { return !!key; }
export function downloadStyle() { return key ? 'https://tiles.stadiamaps.com/styles/alidade_smooth.json' : process.env.EXPO_PUBLIC_ALLOW_OFFLINE_DOWNLOADS === 'true' ? process.env.EXPO_PUBLIC_MAP_STYLE_URL : undefined; }
