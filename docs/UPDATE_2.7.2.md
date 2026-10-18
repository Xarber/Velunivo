# 2.7.2 — focused stability and layout update

Candidate changes, pending native runner compilation and target Simulator checks:

- Paired sync routes every validated protocol packet, including snapshot probe/need messages previously dropped by the paired-channel whitelist. Small archives retain content snapshots; large transfers negotiate a bounded four-block window with older-peer fallback. Compression remains level 1, bounded per block. Progress reports acknowledged data only; waiting for remote preparation is distinguished from local preparation and applying settings. Progress fills are brighter.
- Native panels have a stable outer layout view, one material layer and isolated short content movement. Landscape directions and ride controls share a narrower column; replay cameras reserve the unobstructed map region. Glass tools sit directly below the panel. Duo native controls constrain to the actual vertical tab bar's public anchors above it, replacing the bottom-only accessory. Native Swift compilation/appearance must be checked in the new artifact.
- Reordering and swipe feedback use UI-thread gestures with cancellation and release velocity; button feedback has asymmetric press/release timing. Removed animated sheet heights, blanket layout transitions and stacked live blur. Reduced motion is retained. Scratch reveal uses renderer-owned transitions on vector maps and animated native polygon paint, ending after 480 ms rather than a JS frame timer.
- Maps load a persisted viewport hint before mounting, then follow actual GPS. The hint does not become a location sample or scratch tile. Diamond crops match their pin shape. Transit viewport cells retain overlapping requests while panning and merge completed cells without waiting for the whole viewport.
- Developer changelog version URLs survive direct navigation/hard refresh; diagnostics and GPX actions require Developer Mode. Every React Native modal declares landscape support.

Validation before candidate push: 482 app tests including encrypted snapshot dispatch/reuse and bounded window transfers; TypeScript, Expo lint and Swift syntax parse. Browser Chromium/WebKit checks cover compact vehicle battery rows, loaded badge artwork, Memories roster/seek/play/pause and mobile bounds. More target checks are recorded below as completed; no physical scooter, phone background activity or low-end frame-rate claim is implied.

Dependency: Expo-compatible react-native-gesture-handler 2.32.0, with GestureHandlerRootView. A new native binary is required. No local native compilation or runtime/SDK download.
