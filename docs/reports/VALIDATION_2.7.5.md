# 2.7.5 validation — 4 November 2026

Scope: MapKit/Fabric navigation rotation, pending landscape replay and compact update-popup alignment, opt-in connected-vehicle recording and background notification fallback. No simulator, emulator, local native build or SDK installation was used, per user instruction.

## Implementation findings

react-native-maps 1.27.2 exposes rotation publicly but omits it from the Fabric marker schema, shipped C++ properties and RNMapsMarkerView forwarding. The existing legacy manager patch therefore did not reach the active renderer. Postinstall now patches all three and retains map-bearing subtraction in the annotation view. Dependency cache keys include this script. A native rebuild is required; this is source-level evidence, not a native visual test.

Landscape replay places its SwiftUI map actions in a fixed footer beneath the scrollable controls, avoiding an obscured floating bubble. Compact landscape What's New uses a shrinking scroll area and smaller header. Existing panel-aware camera math and portrait toolbar behavior remain. MapKit already sets showsCompass=false; no new mid-map compass is added.

Background recording uses the established recorder rather than a second archive format. Cold OS wake uses a bounded authenticated-Bluetooth recheck and alert fallback. Inactive recording Live Activity hooks no longer end another recording factory's activity merely on mount. Permission/background behavior has not been physically verified.

## Automated checks

Lint and TypeScript checks passed during implementation. The full suite passed 516 JavaScript tests and 57 Python checks (Python 3.13). Lint, strict typecheck and diff checks passed. Physical validation remains pending. Added coverage for sustained real movement, stale/simulated/invalid/duplicate data, connection gaps, local-only consent and idempotent Fabric patch/schema forwarding. Existing heading, camera, replay-padding and localization checks run in the full suite. An older patch test fixture needed new Fabric files; it was extended rather than weakening the patch's mismatch checks. No test result here proves Core Location wake, BLE radio behavior or rendered alignment.

## Required device checks

- In portrait and both landscape orientations, ride straight then turn: arrow rotates with physical heading and remains forward when the camera follows. Check all arrow styles and the absence of a square shadow.
- Expand/scroll/collapse a replay; confirm position remains in visible map space and map controls remain reachable. Check landscape What's New button visibility.
- Enable automatic Bluetooth recording, grant Always location, connect a real supported scooter while app is open, lock phone, ride above detection speed for ten seconds, then reopen and finish. Verify actual GPS samples, battery telemetry, no duplicate session and no battery prompt.
- Repeat alert-only, denied permissions, active navigation, brief BLE outage, one-minute disconnect and manual-stop cooldown.
- Test OS background wake separately from force-quitting. After moving beyond the monitoring region, confirm an alert only follows a fresh real vehicle-speed confirmation. Denied notification permission and force-quit may prevent an alert; do not claim otherwise.

Physical sync, media/CallKit and broader application validation are outside this batch. The SSD is disconnected and no native-device testing is claimed.
