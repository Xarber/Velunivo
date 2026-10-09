import { ExpoConfig, ConfigContext } from 'expo/config';
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config, name: 'Velunivo', slug: 'velunivo',
  version: process.env.APP_VERSION || config.version || '0.1.0',
  ios: { ...config.ios, buildNumber: process.env.BUILD_NUMBER || '1' },
  android: { ...config.android, versionCode: Number(process.env.BUILD_NUMBER || 1) },
  plugins: [...(config.plugins || []), 'react-native-maps', '@react-native-community/datetimepicker', ['./plugins/withBuildSdk', { api: process.env.ANDROID_COMPILE_SDK, tools: process.env.ANDROID_BUILD_TOOLS }]],
});
