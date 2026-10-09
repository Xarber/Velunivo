export const mapStyle = process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';
export const offlineEnabled = process.env.EXPO_PUBLIC_ALLOW_OFFLINE_DOWNLOADS === 'true' && !!process.env.EXPO_PUBLIC_MAP_STYLE_URL;
