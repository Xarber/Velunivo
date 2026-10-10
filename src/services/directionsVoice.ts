import * as Speech from 'expo-speech';
import { NavigationOptions } from '../core/types';
import { navigationAudio } from './navigationAudio';
import { voiceOptions } from '../core/voice';
let generation = 0;
export async function stopDirections() { ++generation; await (navigationAudio ? navigationAudio.stop() : Speech.stop()); }
export async function speakDirection(text: string, preferences: NavigationOptions) {
  const options = voiceOptions(preferences); if (!options) return;
  const token = ++generation;
  await (navigationAudio ? navigationAudio.stop() : Speech.stop());
  if (token !== generation) return;
  // iOS delegates mixing/ducking to the synthesizer's separate system audio session.
  if (navigationAudio) await navigationAudio.speak(text, options.volume); else Speech.speak(text, { ...options, onDone: () => { if (token === generation) void Speech.stop(); }, onStopped: () => {}, onError: () => { if (token === generation) void Speech.stop(); } });
}
