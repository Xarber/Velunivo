import { NavigationOptions } from './types';
export function voiceOptions(n: Pick<NavigationOptions, 'voice' | 'volume'>) {
  return n.voice && n.volume !== 'off' ? { language: 'en', volume: n.volume === 'quiet' ? 0.35 : 1, useApplicationAudioSession: false } : null;
}
