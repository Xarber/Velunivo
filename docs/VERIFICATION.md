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

First run: prepare and web jobs succeeded; Android setup failed on an obsolete action-default package and was corrected. iOS native job still running. Release publication and AltSource population are gated on successful native binaries and Simulator screenshots. Empty bootstrap apps.json is intentional until a real IPA exists.
