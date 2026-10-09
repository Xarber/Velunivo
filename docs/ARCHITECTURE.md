# Architecture and source research

Researched 2026-10-09. Package versions are pinned by package-lock.json: Expo 57, React 19.2.3, React Native 0.86.3, MapLibre RN 11.5, MapLibre GL JS 6.13. Node 24 is used in CI.

## Components

`src/core` contains pure geometry, GPX validation, ETA, provider normalization, custom routing models and guidance. `src/services` contains provider transport, local persistence, foreground GPS and motion subscription lifecycles, native offline pack operations and file sharing. `src/components/RideMap` has native/web implementations. `src/app` contains Expo Router screens; large displays use a split map/planner layout. `server/index.ts` isolates private API keys from the application bundle and exposes only fixed upstream services.

Map display and route calculation are independent. GraphHopper returns a top candidate from each of its bicycle and car models. “Best” means best under that profile and our exclusions/preferences, not globally safest or legally certified for a scooter. Turn steps and segment details are retained for saved-route guidance.

## ETA

Each segment uses the minimum of hardware maximum and user-entered local riding limit, multiplied by cruise fraction. Context caps, recorded road maximum and provider average speed can slow it further. Rough surface is capped at 12 km/h; living streets at 10; paths/cycleways at 18. Maneuvers add the configured stop delay plus a simple acceleration-loss term. This is a heuristic, not a calibrated simulation. The constant-speed minimum is polyline distance / effective cap. Remaining ETA integrates the untraveled part of a segment. Imported GPX lacks segment details and delays.

Scheduling is pure arithmetic: departure + practical ETA gives arrival; desired arrival − practical ETA gives suggested departure. Uses local device time and validates date components. No traffic conditions or traffic simulation are applied. Current traffic tiles are an optional separate visual layer; future conditions are not inferred.

## Guidance and sensors

GPS is projected onto polyline segments in a limited continuity window after initial acquisition. Fixes older than 15 s or with accuracy worse than 35 m are rejected. Off-route threshold is max(40 m, 2 × accuracy). Guidance shows the next provider maneuver, once-per-maneuver voice cues at approach/near phases and arrival proximity. Voice is only for genuine provider instructions. Simulation is labeled and does not record fake GPS fixes. In the background, processing and speech pause; foreground guidance is the MVP's contract. Motion data are raw diagnostics, not a speed substitute. Position comes from GPS.

Known limitations: projection is not full map matching; parallel roads, loops, GPS jumps and long gaps need device validation. Speech output depends on installed voices and iOS audio behavior. Traffic requests need provider keys. Battery/range and elevation are not modeled.

## Offline growth path

1. Implemented: native MapLibre region database + separately saved route snapshots.
2. Next: pack manifests with schema/version, bounding region, style identity, byte budgets, checksum, expiry and route compatibility.
3. Future: regional routable graph bundles and a native engine interface `route(start,end,vehicle,restrictions)`; benchmark Valhalla or an equivalent engine on device. Map tiles cannot supply this graph. Java GraphHopper is a practical server engine, not an existing drop-in Expo iOS offline SDK.
4. Then: background task integration, rerouting with debouncing/backoff and permission lifecycle, persistent trip state, field trials, battery profiling and route eligibility enrichment.

## Sources and decisions

- [Expo SDK/version matrix](https://docs.expo.dev/versions/latest/): SDK 57 pairs React Native 0.86 and React 19.2.3; iOS 16.4 minimum. Registry scaffold matched the documentation.
- [Expo SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/): foreground watches implemented; background location requires a native build and a separately defined task. Not claimed here.
- [Expo Sensors](https://docs.expo.dev/versions/v57.0.0/sdk/sensors/), [Speech](https://docs.expo.dev/versions/v57.0.0/sdk/speech/): available module APIs and permissions; physical-device verification outstanding.
- [MapLibre Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/), [v11 migration](https://maplibre.org/maplibre-react-native/docs/setup/migrations/v11/), [OfflineManager](https://maplibre.org/maplibre-react-native/docs/modules/offline-manager/): native plugin/build, new architecture, current API names and pack lifecycle.
- [GraphHopper API](https://docs.graphhopper.com/openapi), [custom models](https://github.com/graphhopper/graphhopper/blob/master/docs/core/custom-models.md): vehicle base profile, `limit_to`, exclusions and distance influence. A bicycle profile's access and base speed are still bicycle assumptions.
- [TomTom traffic-flow raster tiles](https://docs.tomtom.com/traffic-api/documentation/tomtom-maps/v1/traffic-flow/raster-flow-tiles): transparent current-flow tiles. No prediction or traffic-based ETA added. TomTom now recommends Orbis for new integrations; this documented v4 adapter is isolated for replacement.
- [Italian current law](https://www.normattiva.it/atto/caricaDettaglioAtto?atto.articolo.numero=1&atto.codiceRedazionale=19G00165&atto.dataPubblicazioneGazzetta=2019-12-30&qId=): 20 km/h scooter limit and urban-road restrictions. A model cap is not legal certification.
- [GitHub runner images](https://github.com/actions/runner-images/blob/main/images/macos/xcode-27-arm64-Readme.md): Xcode-beta runner researched. CI selects the highest installed beta and fails visibly if absent.
- [Android platform reference](https://developer.android.com/guide/topics/manifest/uses-sdk-element): latest stable SDK selected dynamically from channel 0; record exact selected API/build-tools in release artifacts.
- [AltStore source specification](https://faq.altstore.io/developers/make-a-source): feed version order, per-device screenshots/dimensions, real IPA metadata and privacy/entitlements. Classic vs PAL requirements differ.
- [OsmAnd iOS routing](https://osmand.net/docs/user/navigation/routing/osmand-routing/?current-os=ios): alternative mature offline navigator.

- [OpenFreeMap quick start](https://openfreemap.org/quick_start/): public detailed street styles support both MapLibre web and native without a map key. Offline bulk downloads remain an explicit configured-provider choice.

### Device maps and address search (2026-10-09 update)

iOS defaults to react-native-maps 1.27.2 (MapKit/Apple Maps), the [Expo SDK 57 recommended version](https://docs.expo.dev/versions/v57.0.0/sdk/map-view/). Android and web use OpenFreeMap/MapLibre without map keys. iOS can switch to MapLibre for licensed app-managed offline regions. Map rendering is independent of GraphHopper routing and does not establish scooter access. Saved geometry works with either renderer; map packs contain no routing graph.

Scheduling uses [SDK57 date/time picker 9.1.0](https://docs.expo.dev/versions/v57.0.0/sdk/date-time-picker/) with native iOS datetime selection and Android date/time dialogs; web uses datetime-local. Explicit English calendar/relative phrases are parsed locally, then frozen into a confirmed local calendar timestamp. Relative durations use elapsed milliseconds; calendar input validates all components and rejects nonexistent local clock-change times. No provider traffic state enters scheduling arithmetic. This is a small deterministic parser, not Beeper integration or a general language model.

The fullscreen map stays mounted while a floating sheet/sidebar scrolls its controls. The phone handle supports upward/downward drag and an accessible expand/collapse button. Selecting an endpoint hides the sheet, and the map bounds include panel-aware padding. A bounded transparent planner modal keeps the map visible on large screens. Insets and window measurements accommodate notches and resizing.

The official SDK57 scene-lifecycle opt-in is enabled for Xcode27. Prebuild confirmed AppDelegate conforms to ExpoReactNativeFactoryProvider and Info.plist references EXExpoAppSceneDelegate. See [Expo scene migration](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md). This config verification precedes runtime testing; compilation alone is not enough.

Web motion lives in WebMotion.web.tsx with selectors scoped to explicit motion data attributes. Native WebMotion.tsx renders nothing and supplies empty props. Sheet-height transitions and finite popup/content keyframes use CSS; existing RN Web Modal retains its focus trap and exit lifecycle. A reactive reduced-motion media hook disables Modal fade as well as CSS motion. The English-expression schedule field is currently hidden at the user's request; only date/time pickers are exposed.
