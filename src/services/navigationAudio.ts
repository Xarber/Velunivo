import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
export const navigationAudio = Platform.OS === 'ios' ? requireOptionalNativeModule<{ voices?(): Promise<import('../core/speechVoices').SpeechVoice[]>; speak(text: string, volume: number, language: string, voice: string): Promise<void>; stop(): Promise<void> }>('VelunivoAudio') : null;
