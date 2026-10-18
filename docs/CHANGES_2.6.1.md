# 2.6.1 — native regressions and telemetry follow-through

## Implemented

- Native navigation uses the selected vector silhouette as an actual React marker child. MapKit image loading in the installed maps library depends on a legacy current bridge; this can return no image in the bridgeless runtime. MapKit and MapLibre camera requests include measured viewport dimensions, so resizing triggers recentering even without GPS movement. The MapKit camera patch resolves asymmetric padding using map projection.
- An idle Explore screen no longer clears the activity owner set by trip recording. Settings returns to the activity that owns the ride lock. Landscape speed/limit moves to the map's unobstructed right side. Absolute glass sheets no longer animate their first measured layout from an undefined origin.
- Real UIKit `UITabBarController.sidebar.bottomBarView` hosts the map actions when the system sidebar is visible. No window or child hosting controller is injected. Search remains first. Compact bottom accessories are centered; wide layouts without a visible sidebar use the floating native control.
- Web pins use shared vector badge art instead of font-dependent glyphs. Native halo avatars center inside the border. Last-known map positions remain visible during GPS gaps, independently of fresh movement/guidance checks. Safari recovery requests have a bounded lease, including callbacks that never return.
- Vehicle list/details show live or dated last battery readings, including confirmed charging. Disconnected ride estimates require a genuine recent reading, the existing toggle, and at least ten qualified Bluetooth discharge rides. Charge bands learn from original precise GPS/vehicle samples; assumed planning charge is never displayed as a dashboard measurement. Training reads one ride at a time, is cached by finished-record identity, and does not retrain on live checkpoints. Manual battery answers decrement remembered charge exactly once without refreshing the real reading's age.
- Library Memories and Maps use the same preview-row presentation. Show-all tiles appear only above three items; wide rows fill available width. Memories show the local ride path and consenting riders' stacked faces/initials. Vertical section virtualization bounds native map previews.
- Developer sample data and five varied ghost riders are local view fixtures, excluded from the transfer-key allowlist, recordings, rosters, media and peer signaling. Screenshot fixtures enable them. Synthetic Memories are read-only and explicitly identified.
- Historical telemetry adds observed 0–20 km/h acceleration, sustained speed and vehicle/GPS speed-calibration trends. Sensor diagnostics separately report freshness coverage, unique readings, invalid values and sample intervals. Historical anomaly comparisons require similar recorded speed, distance, riding modes, terrain and available charge, temperature and load. Five usable baselines are required for outlier observations; unknown weather and traffic remain disclosed confounders. Raw recordings are unchanged and missing capabilities stay omitted.
- Android native captures receive standalone front-view Pixel Pro-style and generic tablet artwork; no web image is used in native frames. The supplied iFrames iPhone 17 Pro and iPad artwork remains in use. The Android phone artwork is original stylized front-view art, not an official Pixel 11 hardware skin; Google's current Device Art Generator only lists older Pixel artwork.

## Validation

Automated results and final native screenshots are tracked in `WORKLIST_2.6.1.md`. Simulator tests run **after** implementation and automated checks, using a CI-built app, one booted device at a time. No native compilation or runtime download is performed locally. A rendered Simulator result is not proof of physical Bluetooth, Safari's OS location service, LiveContainer or TrollStore behavior.

No firmware commands, CallKit behavior, microphone policy or peer protocol changes are included.

## Primary references

- Expo 57: https://docs.expo.dev/versions/v57.0.0/
- Native tab accessory: https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/
- UIKit sidebar slot: https://developer.apple.com/documentation/uikit/uitabbarcontroller/sidebar-swift.class/bottombarview
- Apple map design: https://developer.apple.com/design/human-interface-guidelines/maps
- Android frame reference: https://developer.android.com/distribute/marketing-tools/device-art-generator

### Automated checkpoint, 18 October

466 app tests pass, lint/type-check pass, 49 Python workflow tests pass, Swift parser accepts the appearance module, and the web export succeeds. Isolated Chromium verifies planner entry, the real analytics UI on a synthetic 120 W / 120 s fixture (4.0 Wh), linked chart/map cursor, responsive width and developer version. No JavaScript exceptions observed. Native behavior remains pending at this checkpoint.

Browser visual follow-up confirmed five map pins with intact avatar/initial faces and loaded vector badges, sample Memory opening, and mobile bounds. Inspection caught a light-mode expanded web sheet using the dark tint with dark text; its tint now follows the same light/dark policy as native. Android capture now turns on the actual developer sample-data controls through UIAutomator, without storage injection or another build. Workflow test total is 50.

Sample riders use a session-seeded random cluster, 45–175 metres from the local position, with at least 45 metres of separation. They keep their relative placement on redraw and follow the local position while moving; toggling the fixture never publishes a real group membership. A deterministic geometry/isolation test covers this behavior.

Final pre-native checkpoint: 468 app tests, 50 workflow tests, lint and type-check pass. Isolated Chromium and WebKit both render all five sample rider pins with vector badges, preserve avatar/initial content, open read-only sample Memories and stay within mobile viewport bounds without JavaScript exceptions. These engine tests inject location; they do not certify macOS Safari's OS location provider.

Sensor reliability additionally rejects wrong value types (for example text speed or numeric charging flags), rather than treating them as fresh numeric coverage.

### Analytics completion

Condition-matched comparison cards now report robust medians for energy, battery use per kilometre, acceleration benchmarks, voltage sag, speed/distance calibration and interruptions per hour. Each metric needs five independently usable peer rides; unavailable values are omitted. Recommendations include smoother acceleration only when fresh vehicle speed and electrical coverage support repeated acceleration's measured energy share, repairing telemetry coverage before comparing incomplete energy, and reviewing conditions before trusting a longer range after a consumption outlier. Comparisons remain observational rather than mechanical diagnoses. Automated total: 470 app tests.
