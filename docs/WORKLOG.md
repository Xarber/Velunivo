# Work log

All entries 2026-10-09, Europe/Rome. Descriptive conventional commits are deliberately unsigned. Global Git signing/key configuration is unchanged.

1. Researched current Expo SDK, React Native pairing, MapLibre native/web APIs and GraphHopper custom routing. Created a separate Expo TypeScript project; no existing repository was modified.
2. Retrieved the attached GPX from the referenced conversation, 153 points. Retained original privately; excludes it from public Git. Public sample is illustrative Milan geometry with clear warnings.
3. Built independent scooter capability/local limit ETA modeling, segment/context speeds, stops and acceleration delays, GPX import/export, guidance/projection checks and provider normalization. Added meaningful tests.
4. Built Expo Router Explore/Library/Scooter screens, dark/light palette, native maps, local saved routes, foreground GPS/voice guidance, simulation, motion diagnostics and native offline pack operations. Explicitly documented missing background/rerouting/graph capabilities.
5. Changed project location at the user's request to /Users/xarber/Productivity/apps. Rejected colliding candidate names after web checks. Selected Velunivo after exact-name searches returned no app/web match and no local folder existed. Preliminary availability is not trademark clearance. Final folder /Users/xarber/Productivity/apps/Velunivo.
6. Added responsive desktop/tablet split view, e-bike preset, departure and arrival-by arithmetic. At the user's instruction, scheduling excludes traffic entirely and displays an explicit warning. Added optional TomTom current-flow overlay independent of ETA.
7. Switched from EAS to GitHub native build workflows. Researched latest AltStore source fields; feed uses actual built IPA metadata/permissions and actual iPhone/iPad Simulator screenshots. Uses a fixed mutable 1.0 release and separate v-prefixed binary releases.
8. Inspected local tools; no full Xcode found. Found installed Android platform/build-tools. Did not download SDKs. GitHub CLI login was initially invalid; user refreshed HTTPS authentication. Created public Xarber/Velunivo repository after authorization.
9. Configured signing off **only in this new repo**, and explicitly use --no-gpg-sign. No physical signing key used. Conventional-commit groups generate release notes without EAS.
10. Local verification caught a missing direct expo-font peer (already present transitively) and a web map-worker loading failure. Declared the installed font offline and served MapLibre's installed worker locally. Recorded test/browser evidence in VERIFICATION.md.

Further build/test outcomes are appended below; unresolved provider or hardware dependencies are not represented as working.

11. Published five unsigned conventional commits and the mutable 1.0 bootstrap feed. Started GitHub verification and native release workflow. Remote Android setup failed because the action requested obsolete SDK package `tools`; configured its explicit package list to `platform-tools`. Web release job succeeded. iOS continued through CocoaPods. Native results remain pending.
12. Browser GPX file chooser successfully imported a generated test track, and Save/Open appeared in Library. No original private GPX was sent to GitHub.

## Address and device-map update

User requested address input, start map selection and platform-native maps. Added explicit address search and candidate selection through a key-private GraphHopper geocoder; editing clears stale resolved points. Added start/destination map picking with cancellation and preview pins, retained GPS/coordinate input. Switched iOS default to Apple Maps and keyed Android default to Google Maps using the SDK57-compatible react-native-maps library, while keeping an explicit downloadable-map renderer and a visible no-key Android fallback. Added restricted key configuration to CI. Installed the JavaScript/native library only; no local SDK was downloaded. Commits remain unsigned.

Previous Verify runs passed. The first native iPhone archive succeeded on Xcode beta; its simulator build remains underway. The first Android job failed during SDK setup because the action requested an obsolete package; the configuration was corrected. Cancelled the pending retry to avoid publishing a release without this requested update; a new build will use the updated commit.
