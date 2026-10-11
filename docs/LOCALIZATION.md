# Languages and speech

Settings → General → App language offers **System** (default), **English** and **Italian**. System resolves Italian device/browser locales to Italian and all other languages to English. The choice is stored in `ui-language-v1`, independently of existing ride/vehicle/settings archives. Language changes apply immediately; foreground/browser language-change notifications refresh System resolution. iOS declares English/Italian bundle localizations.

`src/i18n/core.ts` is the small dependency-free message engine, with English source messages as keys and a handwritten Italian catalog in `src/i18n/it.ts`. `LocalizedText` translates UI text, and `t` handles button/input/accessibility labels. Named placeholders preserve inserted values; unknown text has an English/pass-through fallback. Do not translate stored addresses, vehicle identities, ride samples or names before saving. Use `translate={false}` for explicitly user-authored Text content. Brand/provider names, units and manufacturer extension fields retain their original spelling. Service/firmware errors outside the catalog may remain in their original language.

New route requests send the selected language to Valhalla or GraphHopper, including requests through the supplied server. Existing saved routes retain their original instruction text; changing language does not mutate or silently replan them. Imported GPX files do not gain fabricated turn instructions. Navigation/Live Activity fallback messages are localized.

## Speech voices

Settings → Navigation & audio → Speech voice lists installed voices for the resolved app language. Automatic prefers premium/enhanced voices where exposed, then a regular installed voice. An explicitly selected voice wins only when it matches the language. Its identifier is an optional addition to existing persisted navigation preferences; older preferences migrate unchanged.

The iOS native audio module now enumerates AVSpeechSynthesisVoice voices and picks by quality, preserving the existing per-utterance ducking-session cleanup. This requires a fresh native build. It does not download voices or bypass Apple APIs. Siri/Apple Intelligence speech is **not guaranteed available to third-party synthesis**: only voices actually exposed by the OS are selectable. Installed enhanced/premium voices can improve quality; users manage downloads through iPhone Accessibility speech settings. No physical audio/voice-quality verification was performed for this change.

Android and web use Expo Speech and the platform/browser voice list. The Web Speech API supports synthesis, but voice availability, user activation and background playback depend on the browser. Test voice is a user-initiated control. Native hardware audio, background browser playback and all installed-language combinations still require device testing.

References: [Expo SDK 57 Speech](https://docs.expo.dev/versions/v57.0.0/sdk/speech/), [Apple speech voices](https://developer.apple.com/documentation/avfaudio/avspeechsynthesisvoice), [Web SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).
