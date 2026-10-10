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

Automatic rerouting, hill/battery/weather models and an on-device routing graph are not implemented. Off-route guidance asks you to stop safely and replan. A saved route can be followed offline; calculating a new route requires an online provider. A GPX with only coordinates has no genuine turn instructions, and the app does not invent them.

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

The Vehicles tab saves separate e-scooter/e-bike profiles, with a compact selector only in Where to. Each has a name, speed capability, local riding cap, ETA tuning, icon and optional full-charge range in km or miles. E-bike assistance cutoffs depend on model and market; edit the values for your own vehicle. New e-bikes use 25 km/h, with configurable faster capabilities. Existing single-profile settings migrate unchanged into a saved vehicle; new profiles use generic defaults. Vehicle changes are locked during a ride. When a live candidate was planned at another speed cap, replan it to refresh provider speeds and alternatives. GPX estimates update immediately.

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

Street limits come from Valhalla trace_attributes on the exact route shape, using edge.speed_limit and its geometry indexes. Unknown values remain unknown; the vehicle cap is never presented as a street limit. Missing, mismatched or incomplete road attribution is discarded while retaining the original valid road route with a confirmation warning. Street limits remain unknown on that candidate; missing or invalid instructions also trigger a warning and are not invented. Invalid original route geometry is rejected. If neither candidate is usable, a three-second warning offers Apple Maps or Google Maps with both selected endpoints and cycling/driving mode. External providers use their own ETA and restrictions; Velunivo vehicle settings and schedules are not transferred. When a road route snaps away from the chosen start/destination (e.g. a pedestrian square), the gap is shown and final access is excluded from ETA.

Provider references: [Photon API and demo limits](https://github.com/komoot/photon), [Valhalla route options](https://valhalla.github.io/valhalla/api/route/api-reference/), [public demo fair usage](https://valhalla.github.io/valhalla/start/introduction/), [edge attributes](https://github.com/valhalla/valhalla-docs/blob/master/map-matching/api-reference.md), [GraphHopper path speed limits](https://www.graphhopper.com/blog/2019/11/28/routing-api-using-path-details/). No departure time, predicted/current traffic source or traffic simulation is sent to the routing provider.

Screen sleep is prevented while an active GPS ride or simulation is open. Stopping or clearing the ride releases the wake lock. Native iOS releases it in the background and restores it when returning to an active ride; this does not prevent manually locking the device. Physical-device screen timer verification is still required.

## Ride recording, voice and revised screens (0.1.12)

Spoken directions and Motion readings are persistent global settings. The selected vehicle's former preferences migrate once; later vehicle changes do not alter them. Ride controls offer Loud, Quiet and Off; Quiet uses speech volume 0.35, Loud 1.0. On iOS `useApplicationAudioSession: false` lets the speech synthesizer manage mixing/ducking with other audio, following [SDK 57 Speech documentation](https://docs.expo.dev/versions/v57.0.0/sdk/speech/). Actual music ducking still needs confirmation on a physical device with this build.

Record Rides defaults on and is a persistent global setting. GPS guidance records raw timestamped fixes (longitude/latitude, accuracy, speed in m/s, course), plus available compass headings and the latest accelerometer/gyroscope vectors with their own timestamps. Motion samples are captured at GPS frequency (normally about 1 Hz), with sensors polled at 4 Hz. Missing/stale readings remain null. Motion readings controls live display; recording can collect motion when that display is off. Simulations are excluded. All data stays in local app storage until explicitly exported. Uninstalling the app removes it.

Each ride snapshots the vehicle and planned endpoint names. Precise fixes produce the distance and preview; poor fixes remain in the full JSON record. Without background permission, navigation does not acquire locked-screen GPS; time gaps remain visible in timestamped data and split GPX segments. Checkpoints every 5 seconds and on background/end limit loss after abrupt termination; interrupted sessions remain in Library. Storage errors are shown, and checkpoint writes are serialized. Samples use separate 100-fix storage chunks, and each summary is a separate entry to avoid Android's per-entry limit. There is no automatic history deletion. GPX exports the usable recorded track with timestamps and sensor extensions; JSON exports all raw fixes and sensor samples with units. Ride insights appear after three completed recordings with usable distance, and show trip lengths and observed overall pace, including stops. They do not silently change speed caps or ETA tuning.

Vehicles opens the garage list. Tapping a vehicle opens its edit page, then separate menus for identity/limits, range, pictures and ETA tuning. Adding with + asks for e-scooter/e-bike and does not switch the selected ride vehicle. A one-time migration adds Sharing E-Scooter with hardware 25 km/h and riding cap 20 km/h; deleting it is respected on later launches. Imported native pictures are copied into the app's documents directory and use relative identifiers so iOS container paths may change safely. Older pictures stay in the vehicle gallery until deleted. Web pictures remain local data URIs and are subject to browser storage capacity.

Library imports GPX directly into saved routes. Cards show endpoint labels/coordinates, a real map preview and GPX export. Saved routes migrate from the legacy storage key into separate entries, without deleting the old backup or imposing a 20-route cap. Recorded rides have GPX/full-data export and icon-only deletion.

Use downloadable maps is now a persistent Settings preference. On iOS it selects MapLibre automatically only when a completed pack covers the whole selected route, or the current location when no route is selected; otherwise Apple Maps remains the default. Android/web keep their existing map service. Downloads still require an offline-licensed configured provider, and web downloads remain unavailable. Offline pack coverage does not provide offline route calculation.

Where to contains the compact collapsed vehicle selector, inline search/map icons, current-location actions for either field, address swap, and its own collapsed schedule card. Selecting a search result dismisses the keyboard. Clear schedule appears only when a date has been set. Scheduled ETA never uses traffic conditions. Reroute resets Start to Current location and resolves a fresh GPS fix when planning. Alternative routes and completed route geometry are gray; the brighter green selected remainder is always layered above alternatives, with equal 8-point line widths and contrast outlines on all map renderers.

## Learned ETA, places and native features (0.1.13)

**Sharing E-Scooter** is a permanent preset. It cannot be deleted or have its 25 km/h hardware / 20 km/h riding limits changed. Settings → Show Sharing E-Scooter hides it from the garage and ride picker. Hiding the selected preset selects an owned vehicle; a ride must be ended before changing vehicles. Existing installations restore the preset if it was previously deleted.

**Learned ETA** is enabled in Settings. At least three finished/arrived rides from the same vehicle and matching limits must contain 200 m and 60 seconds of usable GPS intervals. Precise fixes include stops; long gaps, jumps and poor accuracy are discarded. The latest 20 qualifying rides produce a distance-weighted overall pace. The estimate still obeys vehicle/road caps and avoids charging intersection delays twice. It is a local estimate, not a prediction of traffic or future conditions. Changing vehicle limits uses modeled ETA until enough matching rides exist.

Library opens separate **Saved Places**, **Saved Routes**, **Recorded Rides** and **Downloaded Maps** screens. Bookmark an address result or add a place by address/map; saved names and full addresses are searchable at either endpoint. **Start again** on a recorded ride requests normal route alternatives between its actual recorded endpoints. It does not start navigation. Route sharing offers Save to Library first, then Export GPX. Recorded ride sharing exports GPX directly. Tap the app version at the bottom of Settings to reveal the persistent **Developer Mode** toggle; when enabled it shows a GPX/JSON chooser and the icon-only Simulate Ride control.

Where to allows swapping empty endpoints, displays provider POI names plus full addresses, and can collapse to check a selected map pin. Full route overview is available only during navigation. Tap or swipe down on the current turn banner to show upcoming directions; swipe up or close to dismiss.

### Downloadable maps

Online defaults stay Apple Maps on iOS and OpenFreeMap on Android/web. OpenFreeMap is not treated as permission to bulk-download tiles. Native **Settings → Downloadable map provider** accepts a Stadia Maps API key stored in SecureStore. Create an account at [Stadia Maps](https://stadiamaps.com/) and check its current plan and [offline caching terms](https://docs.stadiamaps.com/tutorials/offline-maps-with-flutter-maplibre-gl/). A free plan may suit personal use; provider terms and quotas still apply. The key is added only to Stadia-hosted map requests. It is never committed or put in exported GPX/JSON.

Select a saved/current route in Library → Downloaded Maps to create a small zoom 10–14 region. Only one region downloads at a time. Downloads pause near 90 MB, reserving space under Stadia's 100 MB device cache allowance; ambient cache is capped at 5 MB. Remove unused regions before resuming at the limit. Bulk country maps are outside this MVP. Completed coverage is used automatically when Use Downloaded Maps is enabled, with system/online maps elsewhere. Web does not download regions. A saved route can be followed offline; new address lookup and route calculation still require network access. A provider key and a native build are needed to test actual tile downloads.

### Audio, Live Activities and map overlays

The new local iOS Expo module owns speech's AVAudioSession, ducks other audio while speaking, then deactivates with notifyOthersOnDeactivation on completion/cancellation/interruption/error. A watchdog handles stuck utterances. Loud/Quiet/Off controls stay in ride controls. This needs a fresh native build; Expo Go and older binaries use their existing speech fallback. Physical-device music restoration must be checked after installation.

Live Activities are enabled in Settings for GPS navigation and simulated rides. The lock screen/Dynamic Island shows the next turn and distance; expanded content includes arrival time, minutes and remaining distance. Expo Widgets generates the extension during prebuild. Signed installation must register that extension and its App Group. LiveContainer may not register it, in which case the app keeps ordinary navigation and reports unavailability. Active GPS delivery can renew the activity while background location is permitted. Without it, backgrounding marks guidance paused. Server pushes are not implemented. Android/web omit this feature.

Transit preview enables Apple map POIs/labels or a MapLibre rail/transit overlay. It does not fetch GTFS line names, service schedules or live arrivals. Current traffic uses Apple Maps on iOS; Android/web need the optional configured TomTom proxy. Neither overlay changes scheduled or live ETA.

## Continuous active-ride updates (0.1.14)

Background navigation is on by default in native Settings. Starting an actual ride requests foreground location and, if needed, background permission. On iOS allow Always location; Android explains the permission before opening system settings and shows an ongoing navigation notification. Denial keeps foreground navigation available. Disable this setting before starting a ride if foreground use is preferred.

A globally registered Expo TaskManager location task processes timestamp-ordered fixes, deduplicates foreground/background delivery, updates guidance, checkpoints recording before finishing each background delivery, and renews an existing Live Activity directly without relying on a React render. Stopping/clearing/arriving releases the task and audio. Interrupted/force-quit sessions are not resurrected by a later headless launch. OS delivery is best effort, not guaranteed once per second. Background accelerometer/compass readings are not guaranteed; recordings retain gaps rather than inventing readings. No push service, local SDK download or EAS submission is needed. A fresh native build is required.

## Installable web app (PWA)

Generate assets with `npm run pwa:generate`; export with `npx expo export --platform web --output-dir dist`, then run `node scripts/build-pwa.mjs dist`. `npm run web:preview` performs these steps and starts a local preview. The web workflow packages all of these files in web.zip. Deploy the entire directory at an HTTPS origin root with SPA navigation fallback. Serve manifest.webmanifest as application/manifest+json. Use no-cache for HTML, manifest and sw.js; hashed bundle files can be cached permanently.

Optional GitHub repository variable WEB_PUBLIC_ORIGIN (for example https://your-real-domain.example, with no path) adds absolute OpenGraph/Twitter image URLs, canonical URL and og:url during release export. Leave it unset until a public web deployment exists. No fabricated deployment URL is published.

Settings includes the app icon and an install banner. Supported Chromium browsers expose the native install prompt; Safari shows platform instructions. Metadata includes app identity, descriptions, language, theme/background, display/orientation, categories, 192/512 icons, a safe maskable icon, monochrome icon, Apple touch icon, narrow/wide install screenshots, four app shortcuts, social image/alt text and SoftwareApplication structured data. Install screenshot previews depict a simulated ride from the documented web gallery. No unsupported store ID, permission grant, URL/file handler or background web GPS claim is added.

The service worker caches only public app assets; external map tiles, route/address responses, traffic and personal exports are excluded. Local Library storage remains local. New workers wait; Settings offers Update web app and disables that action during a ride. Closing old tabs also permits normal browser activation. Installed PWA support varies by browser. Web guidance must remain open and does not support native locked-screen GPS or Live Activities. The viewport supports safe-area insets, dynamic height and normal zoom; target-device notch/Home Indicator and software-keyboard verification remain necessary.

Saved Places: Library → Saved Places → pencil → edit name → Save name. Names persist across launches; address, coordinate and identity remain unchanged.

## Simulation feature parity (0.1.15)

Enable Developer Mode from the version label in Settings, then choose the play icon for a selected route. Simulation replaces GPS fixes with synthetic route progress. Voice/volume, registered iOS Live Activities, turn cards, speed/ETA/road-limit displays, compass and enabled motion readings, route overview, maps, safety warnings and ride controls remain available. Live Activities label the ride Simulation. Replanning uses the simulated current position. Recording and learned-pace input are excluded even if Record Rides is on.

No real foreground/background GPS subscription is started for a simulated ride. The simulator uses elapsed time and catches up after OS timer suspension; updates while locked depend on the OS allowing JavaScript execution. It does not invent a GPS location or keep the process alive through fake location/audio use. A registered native extension is still required for Live Activities.

## Live Activity installation checks (0.1.16)

On iOS, Settings → Live Activity check → Check Live Activity reads system authorization, installed widget/configuration, App Group agreement, access to the shared container, and navigation layout presence. During an active ride it also reads the activity count and last native start/update error. Developer Mode shows the underlying booleans/count/error. No permission dialog, installation change, export or transmission occurs. No device/container paths, ride samples or activity identifiers are returned.

An active ActivityKit request does not prove visible rendering; bundled-extension presence does not prove system registration. A missing shared container points to an installation/entitlement issue, but a healthy app-side container does not establish extension-side access. The panel cannot inspect the Lock Screen or jailbreak configuration. Native APIs require a fresh build; web/Android omit this iOS-only panel.


## 0.1.17 — Temporary Live Activity test and iOS navigation arrow

Settings → Live Activity check now offers Test Live Activity and Stop test on iOS. The clearly labelled sample uses a separate widget factory with the same navigation layout, no GPS, voice or ride recording. It cannot be started during a ride through the Settings UI, and its cleanup never touches normal navigation activities. A 90-second timer ends the test while JavaScript runs; if iOS suspends the app, Stop test remains available. A requested activity does not prove that iOS rendered it: check the actual Lock Screen. Installation checks count both test and navigation instances and show native errors. These controls are temporary diagnostics.

iOS uses the native location.north.fill SF Symbol (expo-symbols, Expo SDK 57), centered with a blue fill and white edge. The stationary dot and existing heading/anchor math are retained. Android and web marker behavior is unchanged. This requires a new native build; no local SDK was downloaded. Physical iPhone Lock Screen appearance and the map marker remain device checks.


## 0.1.18 — iOS Live Activity service resolution

The physical iPhone 0.1.17 screenshot showed the generic non-iOS service's “Live Activities require an iOS native build” error. Expo's actual source extension order starts with ts, then tsx; Metro checks platform variants within each extension, so useNavigationActivity.ts won before useNavigationActivity.ios.tsx. Previous exports succeeded while silently bundling the fallback; direct service tests did not cover platform resolution. Renamed the generic service to useNavigationActivity.tsx so the iOS variant wins, retaining Android/web fallbacks. Regression tests call the installed Metro resolver with Expo's actual source extension order from both the diagnostic panel and ride subscription, plus marker platform selection. This repairs the confirmed bundling failure; it does not yet establish TrollStore Lock Screen rendering. No device configuration changes or local SDK downloads.
