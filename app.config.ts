import { ExpoConfig, ConfigContext } from 'expo/config';
import {verifiedLinkHost} from './config/link-host.cjs';
const linkHost=verifiedLinkHost(process.env.EXPO_PUBLIC_SHARE_ORIGIN||'https://velunivo.xcenter.it');
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config, name: 'Velunivo', slug: 'velunivo',
  version: process.env.APP_VERSION || config.version || '0.1.0',
  ios: { ...config.ios, associatedDomains:[...new Set([...(config.ios?.associatedDomains||[]),...(linkHost?[`applinks:${linkHost}`]:[])])], infoPlist: {...config.ios?.infoPlist, UIBackgroundModes:[...new Set([...(config.ios?.infoPlist?.UIBackgroundModes || []),'audio'])],...(process.env.EXPO_PUBLIC_CAPTURE_FIXTURES==='1'?{VelunivoCaptureFixtures:true}:{})}, buildNumber: process.env.BUILD_NUMBER || '1' },
  android: { ...config.android, intentFilters:[...(config.android?.intentFilters||[]),...(linkHost?[{action:'VIEW',autoVerify:true,category:['BROWSABLE','DEFAULT'],data:[{scheme:'https',host:linkHost,pathPrefix:'/share/'}]}]:[])], versionCode: Number(process.env.BUILD_NUMBER || 1) },
  plugins: [...(config.plugins || []), ['@config-plugins/react-native-webrtc',{microphonePermission:'Use the microphone for optional group ride voice chat.',cameraPermission:'Use the camera for vehicle pictures and optional group ride video.'}], 'react-native-maps', '@react-native-community/datetimepicker', ['expo-build-properties', { ios: { enableSceneSupport: true, ...(process.env.VELUNIVO_CCACHE === '1' ? { ccacheEnabled: true } : {}) } }], ['./plugins/withBuildSdk', { api: process.env.ANDROID_COMPILE_SDK, tools: process.env.ANDROID_BUILD_TOOLS }]],
});
