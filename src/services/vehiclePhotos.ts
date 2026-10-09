import { Directory, File, Paths } from 'expo-file-system';
const prefix = 'velunivo-photo://';
export function photoUri(photo: string): string { return photo.startsWith(prefix) ? new File(Paths.document, 'velunivo-vehicle-photos', photo.slice(prefix.length)).uri : photo; }
export function keepPhoto(uri: string): string {
  const folder = new Directory(Paths.document, 'velunivo-vehicle-photos'); folder.create({ idempotent: true, intermediates: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;
  new File(uri).copy(new File(folder, name)); return `${prefix}${name}`;
}
export function deletePhoto(photo: string) { if (photo.startsWith(prefix)) { const f = new File(photoUri(photo)); if (f.exists) f.delete(); } }
