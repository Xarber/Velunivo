# Velunivo

An iOS-first Expo / React Native project for e-scooter and e-bike planning, with a responsive desktop and iPad interface. Repository: https://github.com/Xarber/Velunivo

## What works in the MVP

- Apple Maps on iPhone/iPad, Google Maps on keyed Android builds, and a separate MapLibre downloadable-map option; MapLibre GL JS on web. Phone layout becomes a map-and-planner split view at 900 px.
- Configurable hardware maximum, independent local riding limit, cruise fraction, acceleration and maneuver delays. Shows practical ETA and constant-speed minimum.
- Depart-at and arrive-by calculations in the device's local time. **Scheduled trips do not use traffic conditions or traffic simulation.** The app displays that warning.
- GPX import, geometry-only track following, accelerated simulation, local saved routes and GPX export of foreground GPS fixes.
- GPS guidance with accuracy/freshness checks, progress, next maneuver, voice cues for routes with instructions, off-route notice and arrival detection. Keep-awake while riding.
- Optional accelerometer and gyroscope diagnostics; subscriptions stop in the background and on ride end. No crash detection, sensor fusion or dead reckoning.
- Separate GraphHopper bicycle and car-road candidates with turn instructions and scooter-capped speeds, when your routing server is configured. Each profile can fail independently; no fake fallback route.
- Native offline region creation, progress, pause/resume and deletion, when an offline-licensed map provider is configured.
- Optional current TomTom traffic-flow overlay through the server. It **does not change scooter ETA**, scheduled or otherwise.

## What is not claimed

This is an MVP, not a verified road-ready navigator. Native device sensors, voice output, installation and downloaded maps must be tested on an actual device. Native build status and web checks are recorded in [docs/VERIFICATION.md](docs/VERIFICATION.md).

Scooter access is not the same as bicycle or car access. Both route models exclude motorways, trunk roads, steps, ferries and known roads with limits above 50 km/h. Surface preferences discourage sand/gravel/ground. Provider access rules remain in effect. Missing road-limit/urban-status/scooter-access data cannot be certified. Candidates display an eligibility warning. Italy's scooter preset defaults to 20 km/h; eligibility is limited to urban roads under the current rule. Review local signs and rules. The e-bike preset changes speed assumptions, not the vehicle's legal classification.

Background navigation, automatic rerouting, hill/battery/weather models and an on-device routing graph are not implemented. Off-route guidance asks you to stop safely and replan. A saved route can be followed offline; calculating a new route requires the server. A GPX with only coordinates has no genuine turn instructions, and the app does not invent them.

## Run locally

Node 22.13+ (Node 24 used here), npm, and the committed lockfile. No EAS account or submission is used.

```sh
npm ci
npm run web
# Or a production export + local SPA server on port 8082:
npm run web:preview
```

Production web hosts need an index.html fallback for Expo Router paths; the included preview server handles this.

The illustrative sample works without a routing key. Map resources still require a connection unless downloaded in a native build. `Simulate` exercises track progress without GPS. `Start ride` requests foreground location. Use precise location, not approximate location.

For native development, use your installed Xcode/Android tools:

```sh
npm run ios
npm run android
```

MapLibre requires a native build; **Expo Go cannot run this project**. Do not run those commands if your tools are absent and you do not want downloads. SDK 57 requires iOS 16.4+ and an appropriate Xcode toolchain. No SDKs were downloaded locally during preparation. Use the GitHub workflow for remote builds.

## Configure addresses, routing and traffic

Copy `.env.example` to `.env`; copy `server/.env.example` to `server/.env`. The private keys belong only in the server environment.

```sh
node --env-file=server/.env --import tsx server/index.ts
```

Use `EXPO_PUBLIC_ROUTING_URL=http://localhost:8787` for web on your Mac. A phone's localhost is the phone, not the Mac; for native release apps use an HTTPS server reachable from the phone. The server binds to 127.0.0.1 by default; LAN development needs an explicit HOST and network configuration. Restart Expo after editing public variables. The release workflow uses repository variables `ROUTING_URL`, `MAP_STYLE_URL`, `ALLOW_OFFLINE_DOWNLOADS`. None are private credentials. Restrict public map keys according to the provider's recommended configuration.

GraphHopper's hosted service requires a key/account with custom-model support for `bike` and `car`. The default bicycle profile may retain lower base segment speeds, even when your scooter is faster; the app conservatively respects those speeds. No authenticated route request has been verified without a supplied key. Unsupported custom models produce a visible error, not a relaxed safety policy. Self-hosted GraphHopper profiles and encoded values can be adapted by replacing the server adapter.

`TOMTOM_API_KEY` enables traffic tiles. The client only receives a same-origin fixed-path tile URL; private keys stay on the server. Before exposing the server publicly, add deployment-level authentication, enforce client quotas, configure allowed CORS origins, and review provider terms. The included in-memory quota is a development guard, not production access control.

## Offline maps

Set `EXPO_PUBLIC_MAP_STYLE_URL` to an HTTPS style whose tiles, glyphs and sprites may be stored offline under your provider agreement. Then explicitly set `EXPO_PUBLIC_ALLOW_OFFLINE_DOWNLOADS=true`. Download is disabled by default. The app downloads the selected route's bounding box with a small margin, zooms 10–16; very large regions are rejected. Completed packs use MapLibre's native database. Match the same style when displaying the downloaded region. Test in airplane mode, including cold launch, before relying on it.

Route snapshots (geometry, instructions and details) are stored separately in AsyncStorage. Tile packs **do not contain routable graphs**. Offline route calculation needs a native graph engine and regional graph downloads; see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Releases, source feed and signing

See [docs/RELEASES.md](docs/RELEASES.md). GitHub Actions builds an APK, unsigned iPhone IPA, Apple Silicon Simulator `.app.zip`, web ZIP and actual Simulator screenshots. It uses an installed Xcode beta and the latest stable Android SDK available to SDK Manager. It creates conventional-commit release notes, checksums and binary metadata.

The fixed source URL is:

https://github.com/Xarber/Velunivo/releases/download/1.0/apps.json

The special `1.0` release is a mutable feed container, **not app version 1.0**. Binary tags are `v0.1.0`, `v0.2.0`, etc. Before the first successful native build, the feed contains an empty apps list, not fictitious IPA URLs. After a successful build, it includes actual version/build/date/size/OS floor/permissions, iPhone and iPad screenshots, descriptions, icon, category and news. It preserves previous versions. AltStore Classic / SideStore can re-sign the unsigned IPA; AltStore PAL requires notarization and is not supported by this distribution.

All local commits and tags are deliberately **unsigned**. The local repository disables automatic signing without changing your global Git settings. Use descriptive conventional subjects, e.g. `feat: Add scheduled navigation` or `fix: Respect local speed limits`. Signing can be applied later by rebasing; do not automatically rewrite already published release tags.

## Address input and device maps

Address planning: enter a street/place and city, press Search, then choose a matching result. Both endpoints have a map picker; coordinates and current GPS remain available. Address search needs the routing server and its GraphHopper key. Map picking works without a geocoding key.

Native maps: iOS defaults to Apple Maps without a map key. Android uses Google Maps when `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` is supplied before building; otherwise a visible notice accompanies the street-map fallback. Restrict the key to the Maps SDK for Android, `app.velunivo.mobile` and your signing certificate SHA-1. In GitHub Actions use the `GOOGLE_MAPS_ANDROID_KEY` repository secret. Rebuild after configuring it. `Use downloadable maps` selects the MapLibre offline-capable renderer. Web uses OpenFreeMap.

## Validation and records

```sh
npm test
npm run lint
npm run typecheck
npx expo export --platform web
```

[Architecture and research](docs/ARCHITECTURE.md), [verification](docs/VERIFICATION.md), [work log](docs/WORKLOG.md), [release setup](docs/RELEASES.md).

Your original GPX is retained locally at `assets/tracks/private-example.gpx` and ignored by Git. Public source contains only explicitly illustrative sample geometry. Import your original file from Explore if desired. Routes and GPS fixes are stored locally; route requests send coordinates to the configured provider. No analytics are implemented.

## Existing navigator to consider

OsmAnd supports iOS offline maps, offline routing, bicycle/car profiles and navigation. Its moped profile is not automatically an e-scooter eligibility profile. It is a stronger option for mature offline routing today; Velunivo's particular focus is comparing road candidates with your riding-speed model. [Official routing docs](https://osmand.net/docs/user/navigation/routing/osmand-routing/?current-os=ios).
