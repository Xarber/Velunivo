# Velunivo 1.0.0 — implementation and validation

## Changes

- Optional automatic rerouting requires three accurate off-route fixes over eight seconds, with one request at a time and a thirty-second retry interval. It starts at the current GPS position, preserves remaining stops and the active recording, and reviews restricted replacement routes before applying them.
- Where to replaces Your ride inside its floating sheet. The planner supports twelve intermediate stops, reordering/removal, address/map selection, scheduling and the outlined vehicle picker. Multi-leg instruction and road-detail indexes remain aligned. The layout follows Apple Maps' ordered stops and compact bottom-card pattern; it is not a copy of its proprietary UI.
- Compass is primary. Moving at least 1.5 m/s with accurate GPS and a heading mismatch of at least 50° for eight seconds enables travel direction. Five seconds within 25° or stopped restores compass. Fresh displacement can provide course when GPS omits speed. Navigation, recording and replay share the policy; full-route arrows account for camera rotation.
- Energy estimates use range calibrated from valid same-vehicle ride feedback, modeled speed and actual elevation when the height service is available. Vehicle options expose capacity (Wh) and total rider/vehicle mass. Default capacity and efficiency remain explicit assumptions; wind, weather, tyre pressure, drivetrain and individual battery health are not modeled. Downhill energy credits are not invented. Estimated percentage is not a vehicle battery reading.
- Recorded endpoint names prefer a saved place within 75 m. Otherwise, completed trips request reverse-geocoded labels from Photon. Names become From Home to School / To School where possible. Failing reverse lookup does not prevent saving.
- English, Italian, Spanish, French, German and Portuguese, including System selection and provider instruction locales. The four new full catalogs began as machine-assisted translations; important new messages were reviewed/edited, but a full native-speaker review remains desirable.
- Safe-area-aware saved-place map picker, corrected planner contrast, one-second deliberate info hover that stays open over its content, timed developer gate, non-pointer version text, confirmed developer data reset and inline half-width voice expansion controls.
- Private PeerServer remains preferred. An HTTP 5xx, unreachable endpoint or timeout allows disclosed PeerJS Cloud fallback; invalid configuration, rejected codes and missing peers do not. Recovery probes private service again until a session switches to cloud. Both native/browser transport preserve reconnect/session identity.
- Device sync can include Bluetooth app credentials and the downloaded-map API key only when both peers confirmed private signaling. Public fallback never exports those secrets and refuses incoming private envelopes. File backups remain secret-free. Import failure restores the prior application storage and private configuration. OS Bluetooth device grants/bonding cannot be transferred; browsers may need another device selection, and platform-specific IDs can require replacing a device association.
- Xiaomi lock/unlock are the only new write operations: fixed documented ESC registers, fresh stationary speed check and lock-state readback verification. Mode and lock status are polled. Expanded telemetry uses dashboard tiles and the Eco/Pedestrian display preference. No SHFW profile is inferred; it appears only if a future verified plugin supplies it.

## True offline routing

`src/core/offlineRouting.ts` performs local A* search on actual downloaded OpenStreetMap nodes, ways and turn restrictions. `src/services/offlineRouting.ts` manages chunked local storage and explicit Overpass downloads. Library → Downloaded Maps now offers Download road network around the selected route. Settings → Maps can prefer downloaded networks; otherwise an online failure automatically tries a covering local network.

This initial offline implementation is deliberately regional: at most five networks, 25 MB in total, 70,000 OSM elements per network, and bounded download/search areas. Both endpoints and the connected route must fit the region. It honors mapped access, one-way streets and supported node-via turn restrictions, excludes highways/ferries/steps, conditional access and complex turn restrictions conservatively, and never invents a straight connecting route. Car-road candidates can still include roads above 50 km/h, with the existing explicit restrictions review. OSM access is not scooter-specific legal permission. Live closures, complete address/POI search and terrain lookup are not available offline. Saved places and downloaded street names remain searchable. Sparse/incomplete data can yield no usable route.

Road downloads require no account/API key. The public Overpass instance is for modest personal requests, not an unlimited production backend. Forks can set the GitHub `OVERPASS_URL` variable / `EXPO_PUBLIC_OVERPASS_URL` to an appropriate service. OSM data remains attributed under ODbL. Map images are separate: native MapLibre offline imagery still needs the existing licensed Stadia account/key; iOS system maps expose no app-managed region download. Web app shell caching plus a local road network enables local planning, but does not silently cache all map tiles.

## Files and dependencies

Core additions: `travelHeading`, `rerouting`, `itinerary`, `energy`, `tripNames`, `offlineRouting`, `syncPrivateData`, `appVersion`. Service additions: `useRideHeading`, `tripNames`, `offlineRouting`, `clearAppData`. UI additions: `OfflineRoutingControls`, `VehicleLockControls`. Existing Explore/record/replay/map/Settings/Library/voice/telemetry screens, Bluetooth plugin/bridge, peer transports and device transfer integrate these modules. Four JSON localization catalogs and dedicated core tests are added. No production dependency was added for 1.0.0. `@types/react-dom` is a development-only addition for the web info popover portal.

## Validation

- 212 JavaScript tests, lint and TypeScript checking passed; 17 Python release/screenshot-tool tests passed.
- Real Overpass region in central Milan: 16,266 elements downloaded in about 1.8 s. Offline bicycle calculation used 36 mapped points/14 instructions in 16 ms; residential car-road calculations used real connected nodes in 5–6 ms. Data was development-only, outside the repository.
- Live Valhalla height request returned elevations 123 m and 137 m for public Milan coordinates.
- Headless Chrome checks passed at 1440×1000, 390×844 and 1180×820: adding a stop, persistent planner close control, Library offline controls, info hover delayed one second, moving into the popover and dismissal outside it. No JavaScript exceptions were reported. The web popover uses a body portal to avoid card/scroll stacking; the planner header stays outside the scrollable fields. These are browser viewport checks, not native safe-area proof.
- Existing hosted private PeerServer answered its HTTPS ID endpoint. No PeerServer software update is required for these client changes. The web app must be redeployed and native apps updated.
- Native SDK compilation, new lock operations on a scooter, iOS safe areas/camera rotation, and background peer recovery on real phones are not verified by these tests. All native compilation remains on GitHub runners.

## Release

Package, app, server and visible bundled version align at **1.0.0**. CI passes `EXPO_PUBLIC_APP_VERSION` alongside native `APP_VERSION`, avoiding an older cached Expo manifest determining the visible web version. Binary release tag is **v1.0.0**. The mutable **1.0** AltSource container remains separate and is refreshed by the existing publishing workflow. Commits remain unsigned.

References: [Apple Maps stops UI](https://support.apple.com/guide/iphone/change-or-add-stops-to-your-route-iph837d13d03/ios), [M365 ESC registers](https://github.com/etransport/ninebot-docs/wiki/M365ESC), [Overpass usage](https://wiki.openstreetmap.org/wiki/Overpass_API), [OpenStreetMap license](https://www.openstreetmap.org/copyright).
