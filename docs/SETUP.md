# Setup and feature reference

An iOS-first Expo / React Native project for e-scooter and e-bike planning, with a responsive desktop and iPad interface. Repository: https://github.com/Xarber/Velunivo

## What works in the MVP

- Apple Maps on iPhone/iPad; key-free OpenFreeMap with MapLibre on Android and web, plus a downloadable-map option on iOS. Full-screen map with an expandable bottom control sheet on phones and a floating sidebar on iPad/desktop (700 px+). Address planning opens in a popup over the map.
- Configurable hardware maximum, independent local riding limit, cruise fraction, acceleration and maneuver delays. Shows practical ETA and constant-speed minimum.
- Depart-at and arrive-by calculations in the device's local time. **Scheduled trips do not use traffic conditions or traffic simulation.** The app displays that warning.
- GPX import, geometry-only track following, labeled simulation, local saved routes and GPX export of planned routes or foreground GPS fixes.
- GPS guidance with accuracy/freshness checks, progress, next maneuver, voice cues for routes with instructions, off-route notice and arrival detection. Keep-awake while riding.
- Optional accelerometer and gyroscope diagnostics; subscriptions stop in the background and on ride end. No crash detection, sensor fusion or dead reckoning.
- Separate bicycle and car-road candidates with real turn instructions and scooter-specific ETA. Photon address search and Valhalla public routing work without API keys; an optional server proxy supports GraphHopper custom models. Each profile can fail independently; no fabricated fallback route.
- Native offline region creation, progress, pause/resume and deletion, when an offline-licensed map provider is configured.
- Optional current TomTom traffic-flow overlay through the server. It **does not change scooter ETA**, scheduled or otherwise.

## What is not claimed

This is an MVP, not a verified road-ready navigator. Native device sensors, voice output, installation and downloaded maps must be tested on an actual device. Native build status and web checks are recorded in [docs/VERIFICATION.md](VERIFICATION.md).

Scooter access is not the same as bicycle or car access. Both providers request road restrictions and aligned road details flag motorways, trunk roads, steps, ferries and mapped limits above 50 km/h. Flagged candidates remain available, but starting GPS navigation requires a warning dialog with a three-second delay and explicit red confirmation. Valhalla hard exclusions still permit excluded start/end edges, so the warning postcheck matters. Rough-surface preferences are provider-specific. Provider access rules remain in effect. Missing road-limit/urban-status/scooter-access data cannot be certified. Candidates display an eligibility warning. New installations use a generic 25 km/h scooter, with no assumed range. Set a lower local riding limit where required (for example 20 km/h for scooters in Italy). Review local signs and rules. A profile does not determine the vehicle's legal classification.

Background navigation, automatic rerouting, hill/battery/weather models and an on-device routing graph are not implemented. Off-route guidance asks you to stop safely and replan. A saved route can be followed offline; calculating a new route requires an online provider. A GPX with only coordinates has no genuine turn instructions, and the app does not invent them.

## Run locally

Node 22.13+ (Node 24 used here), npm, and the committed lockfile. No EAS account or submission is used.

```sh
npm ci
npm run web
# Or a production export + local SPA server on port 8082:
npm run web:preview
```

Production web hosts need an index.html fallback for Expo Router paths; the included preview server handles this.

The app starts with an empty planner. Import your own GPX to preview and simulate a track without a routing key. Map resources still require a connection unless downloaded in a native build. `Simulate` exercises track progress without GPS. `Start ride` requests foreground location. Use precise location, not approximate location.

For native development, use your installed Xcode/Android tools:

```sh
npm run ios
npm run android
```

MapLibre requires a native build; **Expo Go cannot run this project**. Do not run those commands if your tools are absent and you do not want downloads. SDK 57 requires iOS 16.4+ and an appropriate Xcode toolchain. No SDKs were downloaded locally during preparation. Use the GitHub workflow for remote builds.

## Configure addresses, routing and traffic

With no routing URL configured, the app uses Photon and Valhalla directly, with serialized requests and a five-minute memory cache. These public demos have fair-use limits and no service guarantee; use self-hosted/contracted endpoints for production. Search text and route endpoints go to these providers. GPX geometry stays local; the explicit endpoint-planning action sends only endpoints.

For the optional local proxy, copy `.env.example` to `.env`; copy `server/.env.example` to `server/.env`. The example leaves GraphHopper blank and enables public providers. Private keys belong only in the server environment.

```sh
node --env-file=server/.env --import tsx server/index.ts
```

Use `EXPO_PUBLIC_ROUTING_URL=http://localhost:8787` for web on your Mac. A phone's localhost is the phone, not the Mac. Leave the routing URL blank for direct no-key public services, or use an HTTPS proxy reachable from the phone. The server binds to 127.0.0.1 by default; LAN development needs an explicit HOST and network configuration. Restart Expo after editing public variables. The release workflow uses repository variables `ROUTING_URL`, `MAP_STYLE_URL`, `ALLOW_OFFLINE_DOWNLOADS`. None are private credentials. Restrict public map keys according to the provider's recommended configuration.

GraphHopper's hosted service requires a key/account with custom-model support for `bike` and `car`. The default bicycle profile may retain lower base segment speeds, even when your scooter is faster; the app conservatively respects those speeds. No authenticated route request has been verified without a supplied key. Unsupported custom models produce a visible error, not a relaxed safety policy. Self-hosted GraphHopper profiles and encoded values can be adapted by replacing the server adapter.

`TOMTOM_API_KEY` enables traffic tiles. The client only receives a same-origin fixed-path tile URL; private keys stay on the server. Before exposing the server publicly, add deployment-level authentication, enforce client quotas, configure allowed CORS origins, and review provider terms. The included in-memory quota is a development guard, not production access control.

## Offline maps

Set `EXPO_PUBLIC_MAP_STYLE_URL` to an HTTPS style whose tiles, glyphs and sprites may be stored offline under your provider agreement. Then explicitly set `EXPO_PUBLIC_ALLOW_OFFLINE_DOWNLOADS=true`. Download is disabled by default. The app downloads the selected route's bounding box with a small margin, zooms 10–16; very large regions are rejected. Completed packs use MapLibre's native database. Match the same style when displaying the downloaded region. Test in airplane mode, including cold launch, before relying on it.

Route snapshots (geometry, instructions and details) are stored separately in AsyncStorage. Tile packs **do not contain routable graphs**. Offline route calculation needs a native graph engine and regional graph downloads; see [docs/ARCHITECTURE.md](ARCHITECTURE.md).

## Releases, source feed and signing

See [docs/RELEASES.md](RELEASES.md). GitHub Actions builds an APK, unsigned iPhone IPA, Apple Silicon Simulator `.app.zip`, web ZIP and actual Simulator screenshots. It uses an installed Xcode beta and the latest stable Android SDK available to SDK Manager. It creates conventional-commit release notes, checksums and binary metadata.

The fixed source URL is:

https://github.com/Xarber/Velunivo/releases/download/1.0/apps.json

The special `1.0` release is a mutable feed container, **not app version 1.0**. Binary tags are `v0.1.0`, `v0.2.0`, etc. Before the first successful native build, the feed contains an empty apps list, not fictitious IPA URLs. After a successful build, it includes actual version/build/date/size/OS floor/permissions, iPhone and iPad screenshots, descriptions, icon, category and news. It preserves previous versions. AltStore Classic / SideStore can re-sign the unsigned IPA; AltStore PAL requires notarization and is not supported by this distribution.

All local commits and tags are deliberately **unsigned**. The local repository disables automatic signing without changing your global Git settings. Use descriptive conventional subjects, e.g. `feat: Add scheduled navigation` or `fix: Respect local speed limits`. Signing can be applied later by rebasing; do not automatically rewrite already published release tags.

## Address input and device maps

Address planning: enter a street/place and city, press Search, then choose a matching result. Both endpoints have a map picker; coordinates and current GPS remain available. Address search needs the routing server and its GraphHopper key. Map picking works without a geocoding key.

Native maps: iOS defaults to Apple Maps without a map key. Android and web always use the same OpenFreeMap service through MapLibre, without a map key. On iOS, `Use downloadable maps` selects the offline-capable MapLibre renderer. Licensed downloads still require an explicitly enabled compatible map style.

## Validation and records

```sh
npm test
npm run lint
npm run typecheck
npx expo export --platform web
```

[Architecture and research](ARCHITECTURE.md), [verification](VERIFICATION.md), [work log](WORKLOG.md), [release setup](RELEASES.md).

Private example GPX files are ignored by Git. No illustrative or private track is bundled in public builds. Import your original file from Explore if desired. Routes and GPS fixes are stored locally; route requests send coordinates to the configured provider. No analytics are implemented.

## Existing navigator to consider

OsmAnd supports iOS offline maps, offline routing, bicycle/car profiles and navigation. Its moped profile is not automatically an e-scooter eligibility profile. It is a stronger option for mature offline routing today; Velunivo's particular focus is comparing road candidates with your riding-speed model. [Official routing docs](https://osmand.net/docs/user/navigation/routing/osmand-routing/?current-os=ios).

Scheduling uses the native iOS date/time picker, Android date and time dialogs, or the browser date/time control. The confirmed local date, time and timezone appear below. The text-expression field is hidden because the limited parser does not support every common phrase. Departure/arrival estimates never use traffic prediction or simulation.

Xcode 27 compatibility: SDK57 builds opt into `expo-build-properties` scene support. Native release validation checks that the Simulator process survives launch and preserves logs on failure. The initial v0.1.0 iOS binary is marked a prerelease because it lacks this scene setting and exits on iOS27; use the corrected build when available.

## Multiple vehicles and trip battery estimates

The Vehicles tab saves separate e-scooter/e-bike profiles, with an active selector in Explore and the planner. Each has a name, speed capability, local riding cap, ETA tuning, voice/motion preferences, icon and optional full-charge range in km or miles. E-bike assistance cutoffs depend on model and market; edit the values for your own vehicle. New e-bikes use 25 km/h, with configurable faster capabilities. Existing single-profile settings migrate unchanged into a saved vehicle; new profiles use generic defaults. Vehicle changes are locked during a ride. When a live candidate was planned at another speed cap, replan it to refresh provider speeds and alternatives. GPX estimates update immediately.

Battery use is approximately trip distance divided by your entered real-world full-charge range, expressed as a percentage of a full battery. Values can exceed 100%, with an explicit warning. Unknown range shows no invented estimate. This does not read vehicle charge or model energy consumption, hills, assistance or weather. Range is stored in km; changing display units does not change it.

Choose distinct scooter/bike symbols, any custom emoji/symbol, or import a PNG/JPEG/WebP picture under 1 MB from Files (web: system file picker). Pictures are stored locally as self-contained data URIs and are never uploaded. A public Wikimedia Commons image-search link is provided; download and import an appropriate image after checking its licence. There is no verified public ScooterHacking vehicle-image API integration.

References: [Xiaomi scooter specifications](https://www.mi.com/uk/product/mi-electric-scooter-3/specs/), [Trek e-bike speed FAQ](https://www.trekbikes.com/us/en_US/ebike_faq/), [Wikimedia Commons vehicle images](https://commons.wikimedia.org/wiki/Category:Electric_scooters), [Expo SDK 57 file picker](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/), [Expo SDK 57 file storage](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/).

## Navigation view

GPS is the default start when opening the planner; if precise location is denied/unavailable, choose a start on the map or search an address. Depart now is the default, with date/time scheduling under Ride options. Clear current ride resets the plan and schedule without deleting Library routes.

During foreground native navigation the map can rotate with the device compass (screen-orientation corrected), falling back to GPS course/current route direction if calibration is poor. Web uses GPS course or route direction, so following faces forward even without a compass. Optional 3D tilted view pitches the camera 50 degrees; building/terrain detail depends on the chosen map's data/style. Show full route temporarily switches to a flat, north-up overview for 15 seconds; Return to navigation resumes immediately. Map orientation and km/mile preferences persist independently of vehicles.

The compact/expanded dashboard shows speed, mapped road speed limit (unknown if absent), your configured riding cap, actual clock arrival, remaining duration and remaining distance. Miles also select mph. ETA does not include traffic. A road limit is provider data, not scooter eligibility certification. Sensor/GPS loss is shown explicitly; simulation speeds/directions are labeled as demo data. Physical-device compass calibration and native camera behaviour still require testing.

Implementation references: [Expo Location heading API](https://docs.expo.dev/versions/v57.0.0/sdk/location/), [screen orientation](https://docs.expo.dev/versions/v57.0.0/sdk/screen-orientation/), [DeviceMotion display rotation](https://docs.expo.dev/versions/v57.0.0/sdk/devicemotion/), [MapLibre camera](https://github.com/maplibre/maplibre-react-native), [MapKit camera integration](https://github.com/react-native-maps/react-native-maps/blob/master/docs/mapview.md).

## Navigation layout and public routing update

The navigation layout follows [Apple's official navigation screenshot](https://www.apple.com/de/newsroom/2022/04/apple-rolls-out-all-new-map-across-germany/): turn banner at the top, speed and mapped limit on the map, and a compact arrival/time/distance card at the bottom. Tilt is now 50 degrees; camera padding puts the arrow lower in the unobscured map to show more upcoming road. The arrow renders above the path. Overview uses independent padding and resets retained navigation padding before fitting the selected route. Both overview controls share the same action and collapse the ride menu.

Settings owns global km/mile units, including mph, vehicle capability/range inputs, saved-route distance and voice distance. Canonical stored km/kmh values are preserved when switching units. Planned routes export to GPX. Imported GPX may be used explicitly to plan new bicycle/car candidates between endpoints; this does not preserve/snap the original track.

Street limits come from Valhalla trace_attributes on the exact route shape, using edge.speed_limit and its geometry indexes. Unknown values remain unknown; the vehicle cap is never presented as a street limit. Missing/mismatched/incomplete geometry attribution still rejects the candidate; verified restricted roads are warnings that require confirmation. When a road route snaps away from the chosen start/destination (e.g. a pedestrian square), the gap is shown and final access is excluded from ETA.

Provider references: [Photon API and demo limits](https://github.com/komoot/photon), [Valhalla route options](https://valhalla.github.io/valhalla/api/route/api-reference/), [public demo fair usage](https://valhalla.github.io/valhalla/start/introduction/), [edge attributes](https://github.com/valhalla/valhalla-docs/blob/master/map-matching/api-reference.md), [GraphHopper path speed limits](https://www.graphhopper.com/blog/2019/11/28/routing-api-using-path-details/). No departure time, predicted/current traffic source or traffic simulation is sent to the routing provider.
