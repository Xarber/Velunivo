<p align="center">
  <img src="docs/brand/banner.png" alt="Velunivo — Your route. Your riding speed. Navigation for e-scooters and e-bikes." width="100%" />
</p>

<p align="center">
  <a href="https://github.com/Xarber/Velunivo/actions/workflows/check.yml"><img src="https://github.com/Xarber/Velunivo/actions/workflows/check.yml/badge.svg" alt="Source verification" /></a>
  <a href="https://github.com/Xarber/Velunivo/actions/workflows/release.yml"><img src="https://github.com/Xarber/Velunivo/actions/workflows/release.yml/badge.svg" alt="Native build and release" /></a>
  <a href="https://github.com/Xarber/Velunivo/releases"><img src="https://img.shields.io/github/v/release/Xarber/Velunivo?filter=v*&color=007F6D" alt="Latest app release" /></a>
</p>

# Velunivo

**Your route. Your riding speed.**

An iOS-first navigator and route planner for e-scooters and e-bikes. Compare bicycle and car-road candidates, estimate travel time for the vehicle you actually ride, and plan on a fullscreen map with floating controls. Built with Expo and React Native for iPhone, iPad, Android and web.

[Download releases](https://github.com/Xarber/Velunivo/releases) · [Setup guide](docs/SETUP.md) · [Build and signing guide](docs/RELEASES.md) · [Verification](docs/VERIFICATION.md) · [Brand assets](docs/BRANDING.md)

## A map first, with the essentials in reach

<p align="center">
  <img src="docs/screenshots/navigation-web-phone.jpg" alt="Phone navigation simulation showing the forward-facing map, turn banner, street limit, speed and arrival card" width="240" />
  <img src="docs/screenshots/navigation-web-desktop.jpg" alt="Desktop navigation simulation with floating controls over the map" width="500" />
</p>

Actual web screenshots on public Milan routes. Speed is labelled **Demo** because these captures use simulation; they are not physical-device test evidence.

## Built around your ride

| Feature | What it does |
| --- | --- |
| Bicycle + car-road choices | Real provider routes with maneuver instructions, road exclusions and mapped speed-limit checks. No-key Photon/Valhalla services are available by default. |
| Your vehicle, your ETA | Saved e-scooter/e-bike profiles with speed capability, a separate riding cap, range, icons and custom photos. Practical ETA, arrival clock, time and distance remaining. |
| Clear guidance | Foreground GPS, spoken instructions, a forward-facing navigation arrow, optional 50° perspective and a temporary full-route overview. |
| Phone to desktop | Apple MapKit on iPhone/iPad; key-free OpenFreeMap/MapLibre on Android/web. Expandable phone controls and floating tablet/desktop panels. |
| Planning + GPX | Address search, map-picked endpoints, native date/time pickers, track import/export and new route comparison between imported track endpoints. |
| Local route library | Save route snapshots locally. Native map downloads are available with an offline-licensed provider; tile downloads are disabled by default. |
| Global preferences | Km/miles, mph/km/h, compass and tilted-view settings shared across the app. |

**Scheduled ETAs exclude traffic conditions and traffic simulation.** An optional current traffic overlay does not change the ETA. Battery use is a distance/range estimate, not a battery reading.

## Get the app

[GitHub Releases](https://github.com/Xarber/Velunivo/releases) contains the APK, unsigned iPhone IPA, Apple Silicon Simulator `.app.zip`, web archive, checksums and release notes for successful builds. An iPhone IPA needs signing with your own account or an appropriate sideloading tool. A Simulator app is not an iPhone IPA.

**[Add Velunivo’s source via AltDirect](https://altdirect.app/?url=https%3A%2F%2Fgithub.com%2FXarber%2FVelunivo%2Freleases%2Fdownload%2F1.0%2Fapps.json)**

Choose your installed sideloading app on AltDirect, or copy the source URL below. The link opens the chooser without automatically launching an app.

**AltStore Classic / SideStore source:**

```text
https://github.com/Xarber/Velunivo/releases/download/1.0/apps.json
```

The special **1.0** release hosts the mutable source feed and app icon. Actual app versions use `v`-prefixed tags. Builds run on GitHub using Xcode beta and the latest stable Android SDK available to SDK Manager, without EAS. Native app branding changes require a new binary.

## Run the web planner

Requires Node 22.13+ (Node 24 recommended) and npm.

```sh
git clone https://github.com/Xarber/Velunivo.git
cd Velunivo
npm ci
npm run web
```

Address search and routing work through public Photon/Valhalla services when no routing URL is set. They have fair-use limits and no production service guarantee. Use the optional server or self-hosted/contracted providers for deployment; see [configuration and privacy details](docs/SETUP.md#configure-addresses-routing-and-traffic).

For a production export and local preview on port 8082, run `npm run web:preview`. Native development requires a development build and installed platform tools; Expo Go cannot run this project. [Full setup](docs/SETUP.md).

## Current boundaries

Velunivo is an MVP. A user reported a successful 8 km physical-device ride on an earlier build. Version 0.1.13 adds learned ETAs, reorganized Library screens, native audio-session cleanup and Live Activities; those native changes and offline pack downloads still need physical-device testing. Scooter access cannot be certified from bicycle/car access or incomplete OpenStreetMap data; inspect signs and local rules. Unknown street limits remain unknown. New vehicle profiles start at a generic 25 km/h capability; configure your actual capability and local riding cap.

Automatic rerouting, offline route calculation and hill/weather energy models are not implemented. A saved route can be followed offline, but a new route needs an online routing provider. Imported geometry-only GPX tracks have no invented turn instructions. [Test evidence and remaining work](docs/VERIFICATION.md).

## Development

```sh
npm run lint
npm run typecheck
npm test
npm run brand:generate  # Rebuild raster assets from the shared vector design
```

[Architecture](docs/ARCHITECTURE.md) · [Work log](docs/WORKLOG.md) · [Contributing](CONTRIBUTING.md) · [Privacy](PRIVACY.md)

Maps and route data retain their providers’ attribution and terms. Original brand geometry and editable SVG exports are included; see [branding](docs/BRANDING.md).

If no usable bicycle or car-road route is returned, Velunivo offers Apple Maps or Google Maps with your selected start and destination. Choose cycling or driving and confirm after three seconds. The other app computes its own route and ETA; your Velunivo vehicle settings are not transferred. Valid routes with unavailable road verification remain available after an explicit warning, with unknown speed limits rather than guessed signs.

### Ride history and garage

Global voice, motion and recording preferences live in Settings. Ride controls offer Loud, Quiet or Off directions. Recorded GPS rides stay locally in Library with map previews, endpoints, GPX and sensor-data exports; insights appear after three completed rides. Vehicles has a garage list with separate edit menus and retained photo galleries, including a permanent Sharing E-Scooter preset with 25 km/h hardware and 20 km/h riding limits, which can be hidden in Settings. GPX import is in Library; Where to owns address search, map selection, swapping, scheduling and the compact ride vehicle chooser. See [setup details](docs/SETUP.md#ride-recording-voice-and-revised-screens-0112).

### Learned ETA, places and navigation (0.1.13)

After three qualifying completed rides with the same vehicle and limits, route estimates can use its observed pace, including stops. Saved Places, Saved Routes and Recorded Rides have separate Library menus. Start again plans alternatives between the recorded endpoints without starting navigation. Normal sharing exports GPX; tap the app version at the bottom of Settings to reveal Developer Mode, which enables JSON export and ride simulation.

Turn cards use readable metre/kilometre or feet/mile distances; swipe down on the active turn banner to browse upcoming directions. Native iOS builds include audio-session cleanup and optional Live Activities/Dynamic Island guidance. Live Activities need a registered widget extension and may be unavailable in LiveContainer. Transit labels/rail overlays and optional current traffic are map previews, not public transport routing or traffic-based ETA. See [0.1.13 setup](docs/SETUP.md#learned-eta-places-and-native-features-0113).

## Install on the web and navigate in the background

The web release includes an installable PWA with Velunivo Home Screen icons, install screenshots, app shortcuts and sharing metadata. Open Settings → Install Velunivo. Safari uses Share → Add to Home Screen on iPhone/iPad, or File → Add to Dock on Mac. Serve the exported site over HTTPS at the domain root; see [setup](docs/SETUP.md#installable-web-app-pwa). Web GPS needs the page open; cached app assets and local Library do not provide offline routing or downloaded web maps.

Native active rides can continue GPS guidance, recording and registered iOS Live Activity updates with background location permission. The OS controls update delivery; force-quitting ends updates. Motion/compass samples may pause when locked. Saved Places can be renamed using the pencil button. These native changes require the 0.1.14 build and physical-device verification.
