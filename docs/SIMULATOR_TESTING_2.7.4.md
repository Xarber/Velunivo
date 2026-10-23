# Simulator validation — 23 October 2026

Uses the user's permanent iPhone 18 Pro and iPad Pro 11-inch (M5), iOS 27.0. One device boots at a time. No local native build, runtime download or extra device creation. Binaries come from GitHub Actions; JavaScript iteration uses the existing development client.

## Regular 2.7.3 binary: observed on iPhone 18 Pro

- Cold launch, welcome/update dismissal and a simulated public Milan GPS fix reached the home screen. Filled Plan a ride button, native tabs and accessory appeared.
- Five sample rider markers rendered avatars/initials and badges.
- A labelled sample recording opened via deep link, played, paused and advanced telemetry, distance and timeline. The position arrow rendered in the regular binary. Landscape rotation placed the route/position beside the controls; expanded controls scrolled to their final fields by touch.
- Ride insights opened with its vehicle filter, summary and four historical charts. Selecting a battery chart point selected the corresponding date and values across charts.
- Plugin menu stayed unavailable until enabled in developer settings. Downloaded the repository's `.vpi` test package, inspected permissions, installed disabled, enabled it, and observed its expected Installed plugin / Choose a destination card on the home screen.
- Simulated navigation hid the tab bar. The directions sheet filled the landscape safe area and did not force portrait.

## Issues found and changes

- Portrait replay's fixed camera padding placed its position underneath an expanded panel. Padding now uses the measured panel height, and wide tablet layouts reserve the panel's side of the map. Mathematical regression tests cover expanded/collapsed portrait, landscape and tablet dimensions.
- Native scratch reveal could leave a solid blue polygon after the animation. The short-lived reveal component now unmounts after 500 ms; reduced motion omits it. There is no render/timer per animation frame.
- The plugin heartbeat could send to the WebView before its message receiver existed. Heartbeats wait for the boot handshake, and native injection safely checks for the receiver. Startup timeout remains bounded.

## Development-client constraints

The older CI development binary loaded current JavaScript without compilation. Its simulator signature reports missing Keychain entitlements (SecureStore and Expo notification registration), so authenticated pairing/notification conclusions cannot be drawn from that binary. Remote Metro image assets did not display as native MapKit image annotations in this client, whereas the regular binary's bundled navigation image did render. Camera projection probes confirmed updated padding; temporary probes were removed.

Synthetic telemetry initially omitted units; those fixture-display artefacts are not evidence of a production parser defect. Samples are local, explicitly labelled, and marked simulated. No user's physical-device data was imported, modified or transmitted.

## Automated validation

510 tests passed, including two new replay layout tests. Lint and typecheck passed. Final target checks are recorded below as they complete.

## Limits

A simulator cannot validate real scooter authentication, BLE radio reliability, physical microphone/camera quality, signing-dependent Live Activity/CallKit behavior or prolonged background endurance. Those remain physical-device checks; no claim of successful hardware testing is made here.
