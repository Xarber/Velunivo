import {version} from '../../package.json';
// Metro embeds EXPO_PUBLIC values in the JS bundle, independent of a cached native Expo manifest.
export const APP_VERSION=process.env.EXPO_PUBLIC_APP_VERSION||version;
