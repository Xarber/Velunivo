# 2.2.0 — exploration, calibrated battery planning and mapped transit

## Changes

- Scratch fog fills and outlines render separately. Enclosed unexplored islands use the same bright mint border as the outer explored area, without doubled borders.
- Apple Maps uses its native traffic road layer instead of a duplicate raster whose native renderer ignores polyline z-index. Traffic and transit overlays sit below route lines on Apple Maps, MapLibre Android and web. Selected routes remain above alternatives.
- Bicycle planning defaults to stronger cycleway / quieter-road preferences. Existing explicitly edited preferences are retained; previously untouched defaults migrate once. Providers can still return the same route when the road network offers no better bicycle alternative.
- Exploration alternatives seek several side corridors, require meaningful new tile coverage (including at least three new return tiles beyond the outward corridor), and accept up to 35% extra distance, or up to 60% only when estimated duration is within 10%. Mandatory stops remain unchanged.
- Record a trip offers an optional exploration round trip: choose the outward destination distance, request real bicycle routes, preview the outbound / return corridor, then record your own GPS trip. It is a map guide in the existing recording dashboard, not automatic turn-by-turn navigation. Unsafe or disconnected candidate loops are rejected; ordinary recording remains available.
- Battery planning fits recorded manual or Bluetooth percentage consumption against actual filtered distance and, when measured terrain varies enough, uphill gain. A distance-only fit includes typical terrain and does not add another invented hill penalty. Mode / voltage-matched samples are used when sufficient; extreme consumption outliers are excluded. Sparse data remains a provisional estimate. Weather, load and battery health can still change actual usage.
- Completed older records are reanalysed with energy-analysis version 2 without deleting their raw readings, manual feedback, bookmarks or rider lists. Calibrations derive from these records and update automatically.
- Fresh connected Bluetooth charge wins. Otherwise the global assumed-charge setting (100% by default) enables reserve / return planning. The UI explicitly labels an assumption. Public sharing scooters remain excluded from battery planning.
- Transit lines shows mapped rail, metro and tram infrastructure. Apple Maps uses bounded, debounced and cached OpenStreetMap queries; MapLibre uses OpenFreeMap vector data. These are not live schedules or guarantees that scooters may be carried aboard. Automated train-assisted itineraries are deferred until reliable timetable and carriage data is available.
- New UI and release messages are localized in English, Italian, Spanish, French, German and Portuguese.

## Release policy

Deploy the matching validated CI web artifact to https://velunivo.xcenter.it for every application update. Preserve the previous release selector for rollback, verify public version / commit, health and PeerServer signaling, and avoid restarting healthy signaling for static-only updates. Native compilation runs only in GitHub Actions. Commits and tags remain unsigned.

The separately requested broader performance review and cleanup remain on hold pending feedback on the previous comparison release.

## Validation

Results are appended after checks. Physical scooter battery prediction accuracy and native map overlay behavior need ride testing; tests and browser checks do not constitute physical-device verification.

- Lint and TypeScript passed.
- 370 app tests and 38 Python workflow tests passed.
- Headless Chrome generated a real bicycle exploration loop from Rome through public Valhalla (route and road-attribute HTTP 200), including a return corridor with additional new tile coverage. All six language settings views rendered without JavaScript errors.
- Regression cases cover 22% / 8 km consumption, identifiable hill costs, manual and Bluetooth training, invalid/outlier records, preference migration, separate island borders and rail/metro/tram filtering.
- iOS native traffic-layer behavior was checked against the installed MapKit bridge implementation; it still needs visual device validation. No native compilation ran locally.
