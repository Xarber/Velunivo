import { Directory, File, Paths } from 'expo-file-system';
const prefix = 'velunivo-photo://';
export function photoUri(photo: string): string { return photo.startsWith(prefix) ? new File(Paths.document, 'velunivo-vehicle-photos', photo.slice(prefix.length)).uri : photo; }
export function keepPhoto(uri: string): string {
  const folder = new Directory(Paths.document, 'velunivo-vehicle-photos'); folder.create({ idempotent: true, intermediates: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;
  new File(uri).copy(new File(folder, name)); return `${prefix}${name}`;
}
export function deletePhoto(photo: string) { if (photo.startsWith(prefix)) { const f = new File(photoUri(photo)); if (f.exists) f.delete(); } }
export async function portablePhoto(photo:string){return photo.startsWith(prefix)?`data:image/${photo.endsWith('.png')?'png':photo.endsWith('.webp')?'webp':'jpeg'};base64,${await new File(photoUri(photo)).base64()}`:photo;}

export function importPhoto(photo:string){if(!photo.startsWith('data:image/'))return photo;const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(photo);if(!match)throw new Error('Invalid vehicle picture.');const folder=new Directory(Paths.document,'velunivo-vehicle-photos');folder.create({idempotent:true,intermediates:true});const name=`${Date.now()}-${Math.random().toString(36).slice(2,9)}.${match[1]==='jpeg'?'jpg':match[1]}`;const file=new File(folder,name);file.create();file.write(Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0)));return `${prefix}${name}`;}
