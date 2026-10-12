# 1.0.5 request comparison and validation

This update extends the existing 1.0.4 implementation. Earlier features and pending hardware constraints are documented in REQUEST-COMPARISON-2026-10-12.md and UPDATE-VALIDATION-2026-10-12.md. Native compilation remains GitHub-only, commits/tags unsigned, and the special 1.0 AltSource tag remains reserved.

| Request | Implemented change | Evidence or remaining limit |
| --- | --- | --- |
| Download menu needs leaving/re-entering | Committed-map subscriptions and road-pack focus refresh; native retained-list notifications | Headless browser download → Done → retained menu showed the new pack immediately |
| Neighborhood/city sometimes missing | Resolve selected square before saving, named-place Photon fallback, nonblocking cached legacy-name upgrades, coordinate-qualified offline fallback | Delayed Photon fixture produced Centro, Milan, Italy; unavailable lookup cannot invent a locality |
| In-button download progress | Shared clipped button fill, real known-byte/native-resource percentage, unknown-total animation, reduced-motion handling | Browser progress element and screenshot checked; native imagery needs account/build test |
| Sync waiting/paused, missing retry | Reconnect/Sync now, independent encrypted heartbeats, progress, timeout and pending-pair retry | Actual two-context private PeerJS pair/merge/reload/unpair passed; manual reconnect passed |
| Settings sync by latest edit | Persisted per-field configured marker/time, explicit default restoration, migration, deterministic ties and atomic data/settings writes | Browser newer units/voice and subsequent edit propagation passed; canonical digests stop insertion-order churn |
| Private API settings | Timestamped private map-key replacement/removal; credentials still private only | Tests cover newer removal/default protection; native credential transfer unverified |
| Transfer landing illustration | Two phone icons/three dots, explanation, actions | Existing visual components/layout preserved |
| iOS trip joining and doubled share URL | Stable inline WebView source/root-origin handling, preserved viewer consent; one native URL payload | Policy/share-payload tests pass; actual native joining needs next binary and network testing |
| HTTPS links opening native | Host-derived iOS associated domains/Android verified filters; AASA/assetlinks endpoints | Real Apple team/entitlements and Android certificate fingerprints still needed; no false identities generated |
| Android Live Updates, not remote push | Own Expo Android module, AndroidX promotion/chip APIs, staleness/dismissal guards; Expo Notifications removed | Autolinking/typecheck/format/privacy tests pass. Compilation/rendering must be checked on GitHub/supported Android |
| Obtainium | Official README import link and app config using existing GitHub APK assets | Obtainium has no separate APK upload. Stable protected signing still requires configured key secrets |
| F-Droid | English/Italian metadata/icons, disabled draft inclusion metadata and dependency audit | Google location/maps dependencies block official inclusion. No false submission/build claim; FOSS flavor and validated recipe required |
| Fresh iPad screenshot | Standard macos-26 verification host using installed tools; beta compilation unchanged | 1.0.4 iPad reused fallback after install timeouts. Next fresh landscape capture still needs inspection |

Validation before push: 246 JavaScript/TypeScript tests (before the final canonical-digest regression; final count recorded below), 29 Python tests, clean lint/typecheck, web export. Android native module resolves through Expo autolinking. Browser checks use fresh isolated contexts and public fixture locations, never user data or real credentials. Baseline browser automatic merge/rename/reload/unpair/backup checks passed. Dedicated 1.0.5 tests passed newer-setting propagation, manual reconnect returning up-to-date, and a subsequent latest-default update without duplicates. Map download browser test uses actual map projection with fixture Overpass/Photon responses; it does not claim real native provider downloads.

No local native compilation, SDK downloads, new app signing identity, or F-Droid submission occurred. Native Live Update support/Universal Links remain subject to OS/signing limits. No continuously suspended PeerJS execution is promised; foreground recovery remains the minimum supported behavior.

Final pre-push checks: **247 JavaScript/TypeScript tests, 29 Python tests, clean lint/typecheck and successful web export**. Native Android module autolinking resolves. Canonical-digest regression and native single-link payload regression pass. The 1.0.5 two-browser settings/reconnect scenario passed all three stages after correcting digest ordering. The road-pack read bound now matches the existing 20 MB / 500 KB chunk download allowance.

Hosted deployment follow-up: staging caught an app-link helper import outside the standalone `server/` package. Production was not switched. The association helper now lives inside `server/`, with a regression that copies and boots only that package, checks health and validates both association endpoints. This server-only follow-up does not change native app code or require replacing the already-pinned 1.0.5 binary tag.
