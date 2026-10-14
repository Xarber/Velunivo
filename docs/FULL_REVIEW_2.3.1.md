# Repository review — 2.3.1

## Scope and method

Repository-wide static inventory covers application screens/components, pure core modules, service hooks, Bluetooth, groups, sharing, server, native modules/config plugins, scripts and workflows. `node scripts/review-inventory.mjs` reads and inventories every supported source file in these directories; generated PeerJS/WebView bundles are reviewed through their source/generator rather than edited by hand. Localization coverage tests also inspect UI literals/errors. Deep manual checks concentrated on rendering, request/subscription ownership, background lifecycle, data preservation, route complexity and persisted-data compatibility.

This is **not** a claim that every feature has been exercised on every device. No local native compilation or SDK download was performed. Desktop/headless browser checks and CPU throttling do not replace a physical low-end phone profile or a scooter test. Native behavior still needs the CI binary/device check.

| Area | Review findings / action |
|---|---|
| Planner, navigation, ETA, route layers | Repeated full-route distance work and quadratic detail lookups removed. Windowed projection uses a binary-search start and the same original window rules. First-match overlapping detail semantics are preserved. Route layer ordering and warnings unchanged. |
| Apple Maps / MapLibre / web | Native route arrays/sources memoized; compass changes no longer recreate split route geometry repeatedly. Disabled camera-follow hooks no longer wake every 100 ms. Map bounds use one pass without large argument spreads. |
| Transit | Shared reference-counted requests: at most two active, abandoned viewports aborted, cache limited by 60,000 coordinate points and 20 entries. No geometry is truncated for display. Provider fallback retained. |
| Offline maps/routing | Only matching coverage is decoded for routing; one decoded pack retained, rather than all cities. Downloads claim their single-flight guard before storage awaits. Completed downloads emit refresh events. Metadata polling remains only while incomplete downloads exist. |
| Recording, GPS, heading, motion | Existing GPS/background ownership and arrival behavior preserved. Accelerometer/gyroscope timestamps retained, with one combined UI update per 250 ms rather than two independent updates. Late asynchronous sensor errors are generation-checked. |
| Archives, initialization, library | Hidden/no-overlay maps no longer subscribe to scratch-history changes. Library uses change/foreground events instead of unconditional five-second polling and only loads the relevant section. A malformed ride/route cannot hide every other record. Failed storage reads or invalid JSON during initialization no longer write empty defaults over persisted settings/places/garage. Original damaged records remain in storage. |
| Battery/vehicle analytics | Comparable windows can grow until altitude uncertainty is acceptable, within the existing 120-second bound. Grouping no longer repeatedly copies growing arrays. Charging/stale/simulated/terrain/mode filters preserved. |
| Backup, device sync, migrations | Existing validation, encryption, IDs, timestamp merges and rollback preserved. Backup sample reads now run sequentially with UI yields instead of launching every ride read in parallel. No schema migration is introduced. |
| Bluetooth | Reviewed generation checks, reply/write deadlines, leases, credential persistence, simulator separation and telemetry freshness. No authentication, firmware or lock command changes in this release. Physical Xiaomi recovery remains a device-validation item. |
| Groups, WebRTC, sharing, calls | Reviewed membership leases, retries, bounded signaling, negotiated senders, stream disposal, recipient limits, framing and native ownership. Working CallKit/Telecom/media behavior deliberately unchanged. Full multi-device/hardware regression cannot be inferred from unit tests. |
| Live Activities / Live Updates, audio, wake | Factory ownership, native queues, stale readings, TTS session teardown and screen-wake leases reviewed. No native audio/widget presentation changes. |
| Scratch map / replay | Recorded **raw GPS**, not compressed display paths, reconstructs a temporary history; rejects poor fixes/teleports and handles backward seeking. Preparation yields every 200 samples. Brief live reveal and review pulses run in leaf overlays; no H3 rebuild, parent-map render, new location watcher or saved-map mutation per animation tick. Replay timer stops at the end. |
| UI/navigation/settings | Phone/tablet/desktop layouts checked in isolated Chrome. Expanded replay contrast corrected. Only telemetry cards receive experimental visual refinements, behind an independent build switch. Existing back fallbacks, settings anchors, warnings, safe-area rules and input conventions retained. |
| Build/server/PWA/release | Existing native jobs, screenshot fallback, source feed, native patches, source metadata, universal links and static deployment reviewed/tested by the workflow suite. No signaling protocol or server restart needed for this release. |

## Measurements

`node --import tsx scripts/benchmark-navigation.ts 93cd711` compares against the previous app code on the same desktop. Synthetic stress fixture: 20,000 points with per-segment speed/limit attributes; one warm-up and 15 runs. Results saved in `NAVIGATION_BENCHMARK_2.3.1.json`.

- Guidance median: **0.669 → 0.019 ms**; p95 **0.928 → 0.114 ms**.
- ETA median: **741.418 → 0.192 ms**; p95 **771 → 0.630 ms**.

These are isolated warmed calculations, not end-to-end frame times. Cold indexing costs, real provider detail density, native rendering, memory pressure and device speed differ. Empty road-detail columns avoid allocating full-length unused arrays. Geometry caches use weak references to immutable route/detail snapshots; mutable recording buffers continue using uncached calculations.

## Validation

- Lint and TypeScript checks pass; **398 application tests and 38 Python workflow tests pass**.
- Full application and Python workflow suites, including new regressions for exact projection/interpolation/ETA equivalence, large route bounds, request cancellation, weighted cache/single-flight limits, damaged records, growing altitude windows, historical scratch replay and cancellation.
- Isolated Chrome with **6× CPU throttling**: settings search, recorded replay/seek/play/pause, recorded telemetry, scratch preview controls, no horizontal overflow at 390×844, 1024×768 and 1180×820, no JavaScript exceptions.
- Browser fixtures confirm replay does not change the stored scratch map and malformed preferences/routes do not overwrite saved places or the damaged originals. Fixtures are synthetic and never presented as physical Bluetooth validation.
- UI screenshots inspected locally, not uploaded to README or release assets.

## Remaining opportunities / limits

1. Full 64 MB backup validation and ZIP exports still require whole objects/output in memory. A versioned streaming archive would reduce peak memory further, but needs compatibility and rollback tests before replacing the current format.
2. Very large scratch histories still scan stored cells to select a viewport; a persistent spatial index is the next substantial map optimization. Native instruments should identify the practical threshold first.
3. Broad root contexts still propagate some profile/group changes to unrelated consumers. A selector-based split is a larger architectural change; defer until real-device measurements justify it.
4. Native offline graph construction/search remains synchronous. It is bounded and heap-based, but large regions would benefit from a worker/native execution boundary after profiling.
5. Public routing/geocoding/transit services can be slow/unavailable; CPU optimizations cannot remove provider latency. Keep provider fallback, timeout feedback and external-map options.
6. Data damaged beyond JSON parsing may require manual recovery. Skipping a damaged row preserves other records and the original stored bytes; it does not repair arbitrary corruption or make that record exportable through the normal validated backup.

No feature was intentionally removed. The new presentation can be reverted independently; see `UI_REFINEMENTS_2.3.1.md`.
