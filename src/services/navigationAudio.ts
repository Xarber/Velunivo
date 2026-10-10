import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
export const navigationAudio = Platform.OS === 'ios' ? requireOptionalNativeModule<{ speak(text: string, volume: number): Promise<void>; stop(): Promise<void> }>('VelunivoAudio') : null;
