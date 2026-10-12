import { centerSquare } from '../core/vehiclePicture';
import { keepPhoto } from './vehiclePhotos';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Image, Platform } from 'react-native';
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

export type VehiclePhotoSource = 'library' | 'files' | 'camera';
/** All sources use the same centered crop, including files without a native crop editor. */
export async function pickVehiclePhoto(source: VehiclePhotoSource = 'library'): Promise<string | null> {
  let uri: string, width: number, height: number;
  if (source === 'files') {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if ((asset.size ?? 0) > 20_000_000) throw new Error('Choose an image smaller than 20 MB.');
    uri = asset.uri;
    [width, height] = await new Promise<[number, number]>((resolve, reject) => Image.getSize(uri, (w, h) => resolve([w, h]), reject));
  } else {
    if (source === 'camera' && Platform.OS !== 'web') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error('Camera access is required to take a vehicle picture.');
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsMultipleSelection: false, allowsEditing: false, quality: 1 };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return null;
    ({ uri, width, height } = result.assets[0]);
  }
  const context = ImageManipulator.manipulate(uri);
  let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  try {
    context.crop(centerSquare(width, height)).resize({ width: 512, height: 512 });
    image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: .8, base64: true });
    if (!saved.base64 || saved.base64.length > 1_333_336) throw new Error('Could not prepare a small vehicle picture. Try another photo.');
    return Platform.OS === 'web' ? `data:image/jpeg;base64,${saved.base64}` : keepPhoto(saved.uri);
  } finally { image?.release(); context.release(); }
}

export async function shareRideData(ride: import('../core/recordings').RecordedRide, samples: import('../core/recordings').RideSample[], format: 'gpx' | 'json') {
  if (format === 'gpx' && samples.filter(s => s.fix.accuracy >= 0 && s.fix.accuracy <= 100).length < 2) throw new Error('This ride has fewer than two usable GPS fixes. Export the full JSON record instead.');
  const { exportRecordedGPX } = await import('../core/gpx');
  const text = format === 'gpx' ? exportRecordedGPX(samples) : JSON.stringify({ ...ride, sampleUnits: { speed: 'm/s', accelerometer: 'g', gyroscope: 'rad/s', heading: 'degrees', timestamps: 'Unix milliseconds' }, sensorSamples: samples }, null, 2);
  const name = `velunivo-${ride.id}.${format}`, mime = format === 'gpx' ? 'application/gpx+xml' : 'application/json';
  if (Platform.OS === 'web') { const url = URL.createObjectURL(new Blob([text], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return; }
  const file = new File(Paths.cache, name); file.create({ overwrite: true }); file.write(text);
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is unavailable on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: format === 'gpx' ? 'com.topografix.gpx' : 'public.json' });
}
