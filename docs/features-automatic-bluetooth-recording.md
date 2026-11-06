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

## 2.8.2: restoration and connection wake correction

The installed BLE fork 3.9.3 requires `iosEnableRestoration: true` to link its Restoration subspec; a JavaScript identifier alone is insufficient. Expo configuration now enables that subspec and supplies the same `app.velunivo.vehicle-central` identifier as the singleton BleManager. Its restore callback records only the restored count in debug diagnostics. The bridge remains the sole reconnect/authentication owner and verifies an existing native connection before reusing it.

A native connection started while iOS is backgrounded now has no application ten-second timeout, allowing Core Bluetooth to keep the request pending for the scooter's return. Foreground and Android connects retain their ten-second timeout. AbortSignals propagate from bridge cancellation into native cancellation, including a late-result guard. Explicit user disconnect/permission revocation is not bypassed. A pending request is not proof the scooter is connected.

Automatic-recording opt-in enables normal Bluetooth auto-reconnect and keeps a monitoring lease while consent is active. Existing Always-authorized location monitoring can be armed after a background reconnect; it no longer requires an active app state first. The existing sustained fresh vehicle-motion detector still controls automatic recording. A newly authenticated background connection additionally offers the existing Start recording / Find destination local notification, even while stationary. A connection alone never creates a ride. Backgrounding an already connected foreground session does not produce a new connection alert. Persistent five-minute alert throttling limits reconnect spam; failed/denied notification scheduling does not consume a successful-alert timestamp. Delivery is still subject to notification permission, Focus and system policy.

This is not arbitrary app launch: Apple documents restoration-driven relaunch for pending Bluetooth activity after system termination, with exclusions for user force-quit. This restriction applies to the Bluetooth restoration route; the native significant-change fallback described below is a distinct mechanism. No push server, hidden shortcut automation, forced relaunch or guaranteed continuous execution is claimed. The existing departure-geofence notification fallback remains. A new native build is mandatory; web reload/OTA cannot add the Restoration subspec.

The separate physical SHFW report (5 November) establishes read mappings and exact scoped restoration. It explicitly does not verify a configuration write ABI; this recording fix adds no SHFW writes.

### Physical acceptance checks

Install 2.8.2, open once, enable automatic Bluetooth recording, confirm notification permission and Always location, then connect a saved scooter. First test foreground sustained vehicle movement for recording; then lock the screen (do not swipe-close), disconnect/reconnect the scooter and verify the connection alert. Test both auto-record and notify-only settings. Check the saved ride and notification actions. Test manual Disconnect while reconnect is pending: it must cancel and remain disconnected. Finally distinguish an OS-terminated restoration test from an explicit force-quit; do not report them as equivalent. Retain debug logs for `ios-state-restored`, `automatic-ride/monitor-armed`, `monitor-failed` and `connection-alert-result`, without credentials. Native endurance, system relaunch and visible alert delivery remain unverified until these tests are performed.

Primary references: [Apple TN3115](https://developer.apple.com/documentation/technotes/tn3115-bluetooth-state-restoration-app-relaunch-rules), installed BLE fork `docs/BACKGROUND.md` and `docs/EXPO_PLUGIN.md` for 3.9.3.

## Native significant-change fallback after swipe-away (2.8.3)

Correction to the earlier Bluetooth-only conclusion: an Apple Core Technologies engineer explicitly states that significant-location-change monitoring can relaunch after a force quit ([March 2026 answer](https://developer.apple.com/forums/thread/818370)). This is not a guarantee of immediate GPS recording or a guarantee across iOS releases; the same answer cautions about the short runtime available for reconnecting BLE.

The new local Expo Apple module `velunivo-ride-wake` registers `CLLocationManager.startMonitoringSignificantLocationChanges()` only with the existing automatic-recording consent, a selected saved vehicle, and Always location. Its AppDelegate subscriber re-establishes the native observer at launch, before React and AsyncStorage. Background App Refresh must be available. The OS chooses when a change is significant; substantial movement and a delay may be needed. Unlike standard continuous GPS, this is a low-energy wake registration. No coordinates or movement path are written by this module. It does not award scratch tiles or synthesize ride samples.

On a qualifying background event, native code can queue a localized, five-minute-throttled movement notification with Start recording and Find destination actions even before React is ready. It says to open the app and connect the scooter, not that recording has started. React startup retains the existing saved-association connection and real-telemetry movement checks for automatic recording. Native location wake is a fallback, not Bluetooth authentication or proof of riding. Cold-start speed/sample availability and the OS execution budget may still require the notification path.

Native enable/title/action labels and diagnostic counters use a private UserDefaults namespace. Disable/clear-all stops native monitoring and clears that namespace; no permission prompt runs from a native wake. Revocation is checked again before queuing a notification. Developer telemetry simulation and unpaired/public vehicles do not arm monitoring. App-owned backups/sync never export this consent. The existing geofence fallback remains separately managed.

A new native build is required. Test the exact swipe-away sequence on a physical iPhone with Always, Background App Refresh and notifications enabled; travel far enough to trigger a significant change. Check whether the OS relaunched the app (`native-location-wake` diagnostics report wake count/time without coordinates), whether native notification appeared, and whether real BLE movement subsequently started a ride. Compare app-open, locked/suspended, system-terminated and explicitly swiped-away cases. Neither browser nor simulator location injection establishes this physical force-quit behavior. Do not mark it verified until that test succeeds. No Shortcut automation or AccessorySetupKit migration was added.
