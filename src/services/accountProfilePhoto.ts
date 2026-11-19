import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { accountRequest } from './accountSession';

export async function loadAccountProfilePhoto(binding: string, signal?: AbortSignal) {
  const response = await accountRequest('profile-photo', { headers: { 'X-Sync-Binding': binding }, signal });
  let file: File | undefined;
  let objectURL: string | undefined;
  try {
    if (Platform.OS === 'web') objectURL = URL.createObjectURL(await response.blob());
    else {
      const bytes = new Uint8Array(await response.arrayBuffer());
      file = new File(Paths.cache, `account-avatar-${Crypto.randomUUID()}.jpg`);
      file.write(bytes);
    }
    const context = ImageManipulator.manipulate(objectURL ?? file!.uri);
    let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
    try {
      context.resize({ width: 128, height: 128 });
      image = await context.renderAsync();
      const output = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.65, base64: true });
      return output.base64 && output.base64.length <= 39_900 ? 'data:image/jpeg;base64,' + output.base64 : undefined;
    } finally { image?.release(); context.release(); }
  } finally {
    if (objectURL) URL.revokeObjectURL(objectURL);
    if (file?.exists) file.delete();
  }
}
