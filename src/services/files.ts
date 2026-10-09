import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
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

// Small, self-contained data URIs persist with the vehicle on all three platforms.
export async function pickVehiclePhoto(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, allowsEditing: false, quality: 1 });
    if (result.canceled) return null;
    const asset = result.assets[0];
    const context = ImageManipulator.manipulate(asset.uri);
    const scale = Math.min(1, 512 / Math.max(asset.width, asset.height));
    context.resize({ width: Math.max(1, Math.round(asset.width * scale)), height: Math.max(1, Math.round(asset.height * scale)) });
    let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
    try { image = await context.renderAsync(); const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: .8, base64: true });
      if (!saved.base64 || saved.base64.length > 1_333_336) throw new Error('Could not prepare a small vehicle picture. Try another photo.');
      return `data:image/jpeg;base64,${saved.base64}`;
    } finally { image?.release(); context.release(); }
  }
  const result = await DocumentPicker.getDocumentAsync({ type: ['image/png', 'image/jpeg', 'image/webp'], copyToCacheDirectory: true, base64: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const mime = asset.mimeType || (/\.png$/i.test(asset.name) ? 'image/png' : /\.webp$/i.test(asset.name) ? 'image/webp' : 'image/jpeg');
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) throw new Error('Choose a PNG, JPEG or WebP image.');
  if ((asset.size ?? 0) > 1_000_000) throw new Error('Choose an image smaller than 1 MB.');
  {
    const blob = await (await fetch(asset.uri)).blob();
    if (blob.size > 1_000_000) throw new Error('Choose an image smaller than 1 MB.');
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not read image.')); reader.readAsDataURL(blob); });
  }
}
