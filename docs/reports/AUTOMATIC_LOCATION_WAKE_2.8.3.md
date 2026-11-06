# Native significant-change wake — 6 November 2026

## Evidence and correction

The user requested operation after explicit app-switcher swipe-away. The prior Bluetooth-only conclusion was too broad for Core Location. [Apple Core Technologies engineer's March 2026 answer](https://developer.apple.com/forums/thread/818370) states significant-location-change monitoring can relaunch after force quit, distinguishes CoreBluetooth's restriction, and cautions that launch/BLE reconnection must fit a short runtime. No guarantee across iOS versions or immediate recording is inferred. Bump's implementation was not inspected or copied. Shortcuts research was not used as a substitute for native location wake.

## Implementation

Added an original Apple Expo module and AppDelegate subscriber using CLLocationManager significant-change monitoring. Persisted opt-in is armed only for the selected saved scooter with existing Always permission; native restoration starts before the React root. No coordinate history, scratch tiles or fabricated recordings are produced. Native wake can queue a localized five-minute-throttled movement notification with foreground recording/destination actions, independent of React readiness. Actual automatic recording still needs authenticated real Bluetooth motion. Memory-only active-ride state suppresses duplicate prompts. Disabling or Clear all data stops native monitoring and clears its private UserDefaults namespace. Background App Refresh is required; timing remains OS-controlled and coarse. Existing geofence and BLE restoration paths remain separate.

No new servers, private data uploads, background permission bypass, AccessorySetupKit migration, Shortcut automation or SHFW writes were added. The complete SHFW read report was reviewed; independent writes remain a separate physical-validation task. Existing Ideas collection had no outstanding pending/approved/deferred records. No private on-device Ideas collection was accessed.

## Validation boundaries

542 JavaScript tests, 57 Python tests, lint and typecheck passed before the final version-only metadata change. Swift frontend syntax parsing passed using the installed command-line compiler; this is not an iOS SDK compile or a native runtime test. Actual Expo autolinking resolves VelunivoRideWake pod/module/AppDelegate subscriber. Added an iOS SDK type-check of the standalone engine to the existing remote iOS job before dependency compilation. Native dependency cache already includes local modules; no SDK or toolchain was installed locally. No simulator, physical iPhone or Android test was performed. Real force-quit relaunch, notification presentation and autonomous recording require the physical sequence in the feature document. Native binary build is mandatory; old 2.8.2 or OTA alone cannot add the module.

Final versioned checks: lint, typecheck, 542 JavaScript tests and 57 Python tests passed. Native status includes process identity/start time as well as event count/time so a physical test can distinguish a real new process from an event in an already-running app. Event counts alone are not proof of a force-quit relaunch.

### Final integration and opt-in protection

Added locked-store startup readiness: readable Bluetooth preferences survive Keychain errors; unknown association state preserves significant-change wake registration instead of silently disarming it, and foreground retries after unlock. Added the user's explicit iOS reduced-protection opt-in with red warning, three-second confirmation delay, serialized Keychain migration and rollback. Optional ordinary-file pairing backups follow that opt-in; private-sync/public-fallback separation remains enforced. No raw filesystem secret storage or API-key export added. All six app languages cover the warning.

The initial remote iOS jobs failed before compilation: the runner contained no beta/RC Xcode and stable fallback was disabled. Both jobs now prefer prerelease Xcode but allow an installed stable fallback without downloading toolchains. Native compilation and physical swipe-away/locked-scooter validation remain distinct pending gates. No local native build or simulator was used.

Final local checks: lint and TypeScript passed; all 552 JavaScript tests passed. Python workflow/tool tests require Python 3.11+ (`hashlib.file_digest`); macOS's system Python 3.9 cannot run that existing checksum test. Re-ran all 57 with the installed Python 3.13; passed. No physical device, simulator, or iOS runtime claim follows from these checks.
