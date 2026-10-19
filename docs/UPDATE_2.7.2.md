# 2.7.2 — focused stability and layout update

Candidate changes, pending native runner compilation and target Simulator checks:

- Paired sync routes every validated protocol packet, including snapshot probe/need messages previously dropped by the paired-channel whitelist. Small archives retain content snapshots; large transfers negotiate a bounded four-block window with older-peer fallback. Compression remains level 1, bounded per block. Progress reports acknowledged data only; waiting for remote preparation is distinguished from local preparation and applying settings. Progress fills are brighter.
- Native panels have a stable outer layout view, one material layer and isolated short content movement. Landscape directions and ride controls share a narrower column; replay cameras reserve the unobstructed map region. Glass tools sit directly below the panel. Duo controls restore the adaptive system navigation toolbar and compensate for overlap with the tab rail in window coordinates, rather than installing another floating bubble. Native Swift compilation/appearance must be checked in the new artifact.
- Reordering and swipe feedback use UI-thread gestures with cancellation and release velocity; button feedback has asymmetric press/release timing. Removed animated sheet heights, blanket layout transitions and stacked live blur. Reduced motion is retained. Scratch reveal uses renderer-owned transitions on vector maps and animated native polygon paint, ending after 480 ms rather than a JS frame timer.
- Maps load a persisted viewport hint before mounting, then follow actual GPS. The hint does not become a location sample or scratch tile. Diamond crops match their pin shape. Transit viewport cells retain overlapping requests while panning and merge completed cells without waiting for the whole viewport.
- Developer changelog version URLs survive direct navigation/hard refresh; diagnostics and GPX actions require Developer Mode. Every React Native modal declares landscape support.

Validation before candidate push: 482 app tests including encrypted snapshot dispatch/reuse and bounded window transfers; TypeScript, Expo lint and Swift syntax parse. Browser Chromium/WebKit checks cover compact vehicle battery rows, loaded badge artwork, Memories roster/seek/play/pause and mobile bounds. More target checks are recorded below as completed; no physical scooter, phone background activity or low-end frame-rate claim is implied.

Dependency: Expo-compatible react-native-gesture-handler 2.32.0, with GestureHandlerRootView. A new native binary is required. No local native compilation or runtime/SDK download.

Additional checks before native testing:

- All 482 app tests and 53 workflow tests pass, plus lint/types and Swift syntax. Initial candidate preparation caught a version-history assertion and untranslated full-note entries; both were corrected before native compilation.
- Two isolated Chromium profiles used the real private PeerServer with synthetic encrypted device credentials. Automatic merge retained both devices' vehicles; a manual repeat completed and remained up to date rather than restarting. These are browser endpoints, not physical iOS sync certification.
- Controlled raw GPS streams recorded and persisted multiple scratch cells in Chromium and WebKit. With GPS silent, initial tile requests surrounded the remembered Rome viewport without creating a position marker. WebKit's actual headless geolocation provider did not reply; no real Safari/macOS GPS claim is made.
- Developer notes with real commit entries open by direct URL and after reload in Chromium and WebKit. The live host's proxy now serves dotted changelog routes as app pages (HTTP 200), with its previous config retained. Nginx was reloaded; PeerServer PID 1342338 stayed unchanged.
- Live public Overpass probes: an unidentified client received HTTP 406/429. A meaningful Velunivo User-Agent returned 707 rail ways for the 5 km Rome cell from Private.coffee in 735 ms; the other provider timed out. Native detail requests identify the app, browser requests retain browser-controlled headers, and the responsive provider is tried first. Provider coverage/availability remains external; fixture tests do not prove every Rome line is mapped.

Native follow-up and latest reports:

- Actual Duo release-binary testing exposed native press styles being dropped by an animated callback style. Concrete evaluated styles fix the Plan a ride background. Native easing uses Reanimated's cubicBezier object; the CSS string form caused a native normalizer error and has been removed. The corrected local bundle remains running and displays the mint button.
- Native tabs were visible on closed and unfolded Duo and Library selection worked. Added an explicit UIKit visibility reconciliation on ride state, window size and foreground return to recover stale system visibility, preserving hidden tabs during an active ride.
- Progress now uses a darker version of the button background and fills with its original color, without a translucent white overlay.
- Current developer notes regenerate even when the release tag already exists or retained notes are empty. A generated build identity travels with the notes artifact to every native/web job.
- Transit uses a bounded, cached same-origin backend proxy to avoid browser CORS failures and identify upstream requests. Public providers are currently returning errors; existing completed cells are retained and retries back off. The new backend is deployed with rollback and WSS verification; final static web deployment is still pending.

Further target findings:

- Duo navigation displayed the chevron bitmap without a square shadow or extra MapKit compass. Full-screen upcoming directions remained landscape with safe-area padding. Arrival stopped the simulation and Done restored all four tabs; expanded/collapsed home panels remained anchored. These checks used the previous CI native binary with the corrected local JS, not the final toolbar binary.
- Native inspection found Fabric camera commands bypassed the existing legacy MapKit padding patch. RNMapsMapView now applies the same viewport projection and honors zero-duration/reduced-motion updates. The idempotence test covers both command paths.
- The first toolbar candidate failed native compilation on an overloaded CGPoint/CGRect `.zero`; the argument is now explicitly CGPoint.zero. No failed binary was promoted as stable.
- Hosted CI web artifact 5b93102 was activated with rollback, public Chromium/WebKit commit/footer/notes checks, health and WSS OPEN. PeerServer PID 723322 was preserved.
