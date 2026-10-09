import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { importGPX, exportGPX } from '../core/gpx';
import { Coord } from '../core/types';
export async function pickTrack() {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if ((asset.size ?? 0) > 5_000_000) throw new Error('Choose a GPX smaller than 5 MB.');
  const xml = Platform.OS === 'web' ? await (await fetch(asset.uri)).text() : await new File(asset.uri).text();
  return importGPX(xml, asset.name.replace(/\.gpx$/i, ''));
}
export async function shareTrack(points: Coord[]) {
  if (points.length < 2) throw new Error('Record at least two GPS fixes first.');
  const xml = exportGPX(points);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([xml], { type: 'application/gpx+xml' }));
    const a = document.createElement('a'); a.href = url; a.download = 'velunivo-ride.gpx'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
  }
  const file = new File(Paths.cache, 'velunivo-ride.gpx'); file.create({ overwrite: true }); file.write(xml);
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/gpx+xml', UTI: 'com.topografix.gpx' });
}
