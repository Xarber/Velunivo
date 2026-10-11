import * as Speech from 'expo-speech';
import { NavigationOptions } from '../core/types';
import { navigationAudio } from './navigationAudio';
import { voiceOptions } from '../core/voice';
import {languageTag,t} from '../i18n/core';
import {preferredVoice,SpeechVoice} from '../core/speechVoices';
export async function availableSpeechVoices():Promise<SpeechVoice[]>{return navigationAudio?.voices?navigationAudio.voices():Speech.getAvailableVoicesAsync();}
let generation = 0;
export async function stopDirections() { ++generation; await (navigationAudio ? navigationAudio.stop() : Speech.stop()); }
export async function speakDirection(text: string, preferences: NavigationOptions) {
  const options = voiceOptions(preferences); if (!options) return;
  const token = ++generation;
  await (navigationAudio ? navigationAudio.stop() : Speech.stop());
  if (token !== generation) return;
  // The iOS bridge releases its owned ducking session after every utterance.
  const language=languageTag();
  if (navigationAudio) await navigationAudio.speak(t(text), options.volume,language,preferences.speechVoice || ''); else {
  const voices=await availableSpeechVoices().catch(()=>[]);if(token!==generation)return;const voice=preferredVoice(voices,language,preferences.speechVoice);
  Speech.speak(t(text), { ...options,language,voice:voice?.identifier, onDone: () => { if (token === generation) void Speech.stop(); }, onStopped: () => {}, onError: () => { if (token === generation) void Speech.stop(); } });
  }
}
