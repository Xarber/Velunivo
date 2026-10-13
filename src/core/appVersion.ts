import {version} from '../../package.json';
// Metro embeds EXPO_PUBLIC values in the JS bundle, independent of a cached native Expo manifest.
export const APP_VERSION=process.env.EXPO_PUBLIC_APP_VERSION||version;

// Metro embeds the CI revision in each native/web bundle; no secrets are included.
const revision=process.env.EXPO_PUBLIC_COMMIT_SHA;
export const APP_COMMIT=revision&&/^[a-f0-9]{40}$/i.test(revision)?revision.toLowerCase():null;
