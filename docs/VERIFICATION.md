# Verification record

2026-10-09, Europe/Rome. See WORKLOG for changes and remote build results.

## Local checks

- 12 core/server tests passed: polyline distance, capped ETAs, remaining segments, slower surfaces/delays, GPX round trip and invalid XML/disconnected data, coordinate conventions, exclusion models, provider response validation, route projection, stale/poor GPS fixes and arrival, no-key server behavior.
- TypeScript and Expo lint passed.
- Web production export passed. A real browser loaded the map and illustrative polyline. Initial MapLibre GL JS worker-loading failure was reproduced and fixed by serving the installed worker via Expo public assets.
- Browser checked at 393×852 and 1440×900. Actual web screenshots are in docs/screenshots; they are **web previews**, not native-device proof.
- Arrive-by input 2026-10-10 09:00 produced suggested departure 08:53 for the sample; the no-traffic scheduling warning remains present.
- Labeled simulation starts track guidance and End ride stops it. Simulation does not record GPS fixes.
- Expo Doctor initially reported missing direct expo-font peer. It was already installed transitively at the SDK-matched version; it was declared directly using an offline lockfile update, with no new package download.
- Real browser file chooser imported a test GPX; saving it made it appear in Library.
- Workflow YAML parsed locally. Native-config introspection passed without generating/downloading SDKs.

## Native and provider boundaries

No full Xcode app was found in /Applications or through Spotlight; only Command Line Tools and Simulator support directories. Android platform android-36.1 and build-tools 36.1.0/37.0.0 exist locally. No local SDK downloads or installation were performed. No local iOS archive is claimed.

Authenticated GraphHopper and TomTom calls require keys. Their adapters, validation, no-key errors and documented API contracts are implemented, but live authenticated responses are untested. Native offline download/display, GPS/motion hardware behavior, speech and sideloading require a real device/native build and configured provider. Background guidance and offline route calculation are not implemented.

Online npm audit initially reported 30 inherited/transitive advisories (11 moderate, 19 high), including ecosystem/tooling ranges; its suggested fixes included incompatible downgrades. No forced downgrade was applied. Offline lockfile updates do not establish a clean live audit. Review current advisories and compatible fixes before production distribution.

## Remote builds

First run: prepare and web jobs succeeded; Android setup failed on an obsolete action-default package and was corrected. The original iPhone archive succeeded on Xcode 27.2 beta; its superseded Simulator build was cancelled after the native-map change. Release publication and AltSource population are gated on successful native binaries and Simulator screenshots. Empty bootstrap apps.json is intentional until a real IPA exists.

Address/device-map update: local typecheck, lint, all 12 existing core/server tests and web production export passed. Config introspection passed with the platform-map plugin. In the real browser, typed a public landmark (`Duomo, Milano`), confirmed the honest missing-service message, picked Start on the actual map and observed the coordinate return to the Start field; repeated for Destination and observed its field update independently. No live geocoding results have been tested without provider credentials. Apple/Google map code has not yet been tested on a physical device; the updated iPhone archive succeeded; Android and Simulator builds remain in progress. Native camera, marker and gesture behavior must be checked on device before road use.

After adding react-native-maps, Expo Doctor passes all 21 checks. The current npm audit reports 31 advisory entries (11 moderate, 20 high), largely propagated from Metro/Expo build tooling; react-native-maps inherits the React Native advisory chain. The suggested automatic resolutions downgrade the SDK/runtime and were not applied.

Feed maintenance behavior was checked with isolated synthetic metadata: refreshing an existing app updates its description and retains the previous version. Fixtures stayed in ignored work/ and were not published. Workflow YAML parsed after the shared source-publication concurrency guard.

0.1.1 follow-up: all 17 tests, lint, typecheck, web export, native iOS/Android JS exports and Expo Doctor (21/21) passed. Browser opened with no fabricated track, parsed `Today at 9:00` into today's 09:00 and `in 3 hours and 35 minutes` into a concrete local time. Both picker value and confirmed Europe/Rome timezone were visible. Original ignored GraphHopper GPX initially exposed a compatibility bug: exports contain both a full track and sparse route waypoints. The importer now prefers the single continuous full track without joining representations or inventing turns; a synthetic regression test covers this. Re-tested the private file through importer/ETA/guidance modules locally; the initial browser chooser attempt did not complete; after the importer correction, the real browser successfully imported the original file, displayed 8.1 km / 31 min at the default 20 km/h cap, then simulated on-track progress to 6.7 km / 26 min remaining. No GPS recording or invented turn instructions were produced. No private geometry is committed or used in release screenshots.

Correction to native validation: actual v0.1.0 Simulator screenshot shows SpringBoard. A successful compile and launch command did not prove survival. Native runtime verification is being repeated with process-survival checks and crash/log artifacts. Physical device testing remains outstanding.

Fullscreen-overlay follow-up: lint/types and all 17 tests pass. Local web export passed. One repeated native bytecode export hit the Mac's temporary disk-space limit; no unrelated files were removed. Native JS export is rerun without bytecode, while GitHub Verify/native builds run full bytecode compilation on runners. Native scene configuration was checked in generated sources: AppDelegate conforms to ExpoReactNativeFactoryProvider and the manifest uses EXExpoAppSceneDelegate. The v0.1.0 release is now a prerelease with a documented iOS27 startup failure; the corrected native build is pending.

Real browser overlay QA: 393×852 phone supports expand/collapse, internal control scrolling and date/time edits that persist when switching to Arrive by; planner opens as a bounded popup. 1024×768 tablet and 1280×800 desktop render a floating sidebar over the full-size map. Start map-selection hides the popup controls. Map attribution remains visible above phone controls. Native JS exports without bytecode passed; full native/bytecode runner checks follow separately.
