import * as Speech from 'expo-speech';
import { NavigationOptions } from '../core/types';
import { voiceOptions } from '../core/voice';
let generation = 0;
export async function stopDirections() { ++generation; await Speech.stop(); }
export async function speakDirection(text: string, preferences: NavigationOptions) {
  const options = voiceOptions(preferences); if (!options) return;
  const token = ++generation;
  await Speech.stop();
  if (token !== generation) return;
  // iOS delegates mixing/ducking to the synthesizer's separate system audio session.
  Speech.speak(text, options);
}
