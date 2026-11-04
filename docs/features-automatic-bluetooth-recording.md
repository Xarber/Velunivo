# Automatic Bluetooth ride recording — 2.7.5

## User behavior

Settings → Recording & battery → Automatic Bluetooth recording is off by default. Enabling explicitly requests local notifications and location permissions. A second switch selects alerts instead of recording. Web displays the setting disabled; no web background recording is claimed.

A real connected vehicle must report fresh speed of at least 2 m/s for at least ten seconds and four distinct samples. Stale, future, simulated, wrong-vehicle, nonfinite and wrong-unit readings cannot trigger it. Five-minute cooldown prevents repeated offers after a manual stop. A root-owned recorder uses the existing ride archive, telemetry collection preferences, conservative GPS path cleanup, scratch session and short-ride rules. Existing navigation/recording wins; auto-start never replaces it. Its visible banner lets the user finish and save. Recording ends after one minute without a connection, or when the switch is disabled. Bluetooth rides do not request manual battery usage.

## Background and terminated-process behavior

While foregrounded and connected, Always location permits a balanced-accuracy monitoring task; this does not save GPS history or scratch tiles. Detected recording switches to the existing navigation-grade recording task. Releasing monitoring cannot stop a newer ride's task because the shared location service checks owner tokens. Automatic recording reports through the existing recording Live Activity. GPS task delivery updates its data directly rather than depending solely on React timers.

An iOS geofence exit (200 m around a recent connected position) is an additional low-power wake hint. Expo defines the task at module scope. After a system wake, the task loads local consent and settings, attempts only an existing saved Bluetooth association, and waits at most twenty seconds for qualifying real vehicle movement. It never opens a picker or registers new pairing. If confirmed it sends a tap-to-record notification. This headless path deliberately does not claim recording has begun: a mounted React recorder is not guaranteed after termination. Walking or car movement alone is insufficient. Wake delivery and reconnection are system/network controlled and may be delayed or unavailable.

Force-quitting, denied permissions, disabled Background App Refresh and OS resource decisions can prevent detection. No App Intent is used as a background-execution bypass. Neither notification delivery nor automatic start after arbitrary termination is guaranteed. Physical-device validation is pending.

## Consent, storage and privacy

The two preferences participate in existing timestamped settings sync. `automatic-ride-consent-v1`, `automatic-ride-vehicle-v1`, and the alert cooldown are local-only and excluded from transfer; a synced preference cannot grant another device permission. Enable locally after reviewing the explanation. Disabling stops location wake monitoring; Clear all data also stops it and removes these keys. The system retains one coarse monitoring region, not a visited-location history. Regular ride data is recorded only after detection. No cloud service or push subscription is introduced.

Modules: `core/automaticRide.ts` handles pure detection; `automaticRidePermissions.ts` handles explicit permission requests; `automaticRideWake.ts` handles native task registration/arming; `AutomaticRideRecorder.tsx` owns recording lifecycle; `AutomaticRecordingSettings.tsx` exposes the opt-in controls. Installation requires a newly built native binary for the MapKit patch; there is no local build in this task.

## References

- [Expo SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/): background permissions, module-scope tasks and geofence limitations.
- [Apple significant-location service](https://developer.apple.com/documentation/corelocation/cllocationmanager/startmonitoringsignificantlocationchanges()): an alternative wake mechanism, not implemented here.
- [Apple Core Bluetooth background processing](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html): background events do not guarantee indefinite execution.
