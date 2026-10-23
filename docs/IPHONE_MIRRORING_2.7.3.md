# iPhone Mirroring checks — 21 October 2026

Physical iPhone, connected through iPhone Mirroring. Standalone Velunivo and the LiveContainer development client were both present; the app switcher confirmed their identities. Development client loaded from a manually entered Mac LAN URL, with lazy Metro imports disabled.

## Observed

- Standalone Data transfer opened; Back returned to General settings.
- Standalone Explore opened, live GPS reached “Live location,” Plan a ride had its filled background, and the native controls/accessory and tab bar were visible.
- Destination text entry and automatic address results worked. Mirroring input sometimes arrived late or reordered early keystrokes; the final Colosseo query returned the expected public destination. Starting actual navigation was not established by that observation.
- Development client loaded the current local JavaScript bundle.
- Library previews and Recorded Rides opened with the existing local recordings.
- Icon-enhanced Ride insights rendered on the physical iPhone; scrolling exposed the first ride card. After the requested refinement, the compact Ride insights entry opened its dedicated submenu, showing the vehicle selector, summary and rendered distance-over-time chart. Selecting a point showed its date, measured distance and chart crosshair.
- The official downloadable `.vpi` demo was fetched on the phone. The metadata/permission preview and packaged PNG icon rendered correctly; no executable manifest field is used. The downloaded demo appeared installed, disabled initially, and its enable switch changed to on without a visible runtime error. After Mirroring resumed, the expanded Your ride menu displayed the expected “Installed plugin” card and “Choose a destination” output. This exercised the separate local library, Worker runtime and permission broker on the physical iPhone.
- Personal-vehicle list and detail views showed the cached battery percentage with its timestamp and a readable vehicle name. The detail page exposed Bluetooth Connection.
- Vehicle performance opened with the qualifying-ride explanation and rendered historical speed-calibration and acceleration charts from existing records.
- Recorded-ride replay opened with its timeline and electrical dashboard. Starting playback advanced elapsed time, distance, map position, speed, battery, voltage, current and calculated power. This did not create a new ride.
- A startup React Native warning reported a raw text node in AppIntroduction. Removed the stray whitespace child between conditional views. Existing error handling correctly preserved and surfaced the warning.

## Constraints

Mirroring intermittently paused or returned `noWindowsAvailable`; rebinding restored the window. Inputs often settled after a separate screenshot observation. Later coordinate input repeatedly returned `noWindowsAvailable` even while screenshots still showed the connected phone. The user restored the connection and testing resumed. Native scrolling and navigation coverage remains limited to the explicitly observed screens. No successful tap is inferred from pointer movement alone.

No new Bluetooth hardware pairing, two-device sync, group media call, new consented Memory, iPad/Fold landscape, native crash recovery, or background endurance was proven by these checks. Existing personal data and pairings were preserved.

## Package change

VPI/ZIP import validates metadata, bounded local code/data modules and optional PNG icons before installation. Existing installed legacy plugins remain readable. Downloaded modules use the existing Worker/WebView isolation and explicit permission broker. Native or remotely imported libraries are unsupported. See PLUGINS.md for the package guide.
