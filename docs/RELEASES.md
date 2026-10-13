# GitHub builds and releases

No EAS submission and no local SDK downloads. The workflows are ordinary Expo prebuild + Xcode/Gradle builds on GitHub runners.

## Repository configuration

Actions must be enabled. Workflows have minimum default read permission; publishing jobs request contents write. Do not enable immutable releases for the special `1.0` source-feed container, because its assets are intentionally replaced at a fixed URL. The feed tag is never moved. Published binary releases use immutable version tags; do not reuse a binary version.

Optional repository variables: `ROUTING_URL` (HTTPS private-key proxy), `MAP_STYLE_URL` (public restricted map-style URL), `ALLOW_OFFLINE_DOWNLOADS` (`true` only when licensed). No configured variables means an empty planner with GPX import/simulation, online key-free maps, Photon address search and Valhalla public routing. Live TomTom traffic remains unavailable without a server key. The public routing demos are for fair-use development; production should configure a durable HTTPS proxy/provider. Server keys are configured on your separately deployed server, not in the public repo or app bundle.


Optional Android signing secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Keep a stable keystore for upgrades. Without them, the native template's development signing key is used; the release notes state this. iOS builds are unsigned and packaged for AltStore Classic/SideStore to re-sign. No Apple certificate or physical security key is requested. This is not App Store/PAL notarized distribution.

## Run a release

Either push an unsigned lightweight tag `v1.0.0`, or dispatch **Build and release** with version `1.0.0`. Never use `1.0` for a binary release; it is reserved for AltSource. The first successful run creates the matching binary release and updates the `1.0` feed release. Every build validates lint/types/tests first. APP_VERSION is injected from the validated version; BUILD_NUMBER is the Actions run number. The IPA's actual Info.plist is checked against the tag before its source entry is created.

The workflow builds:

- Android release APK with SDK Manager's highest stable integer API and build-tools package. It uses command-line tools shared with Android Studio; no IDE is needed on the runner.
- iPhone archive on `xcode-27`, selecting the newest installed beta by DEVELOPER_DIR. It does not silently choose stable Xcode or download Xcode. The unsigned .app is packed inside Payload in an IPA.
- Apple Silicon iOS Simulator .app.zip. Simulators install .app bundles, not iPhone IPAs. No Simulator runtime is downloaded; a missing installed runtime triggers historical screenshot fallback without blocking compiled binaries.
- Web static export ZIP.
- Build metadata and conventional release notes, consolidated in `build_info.json`. Native screenshots are captured separately after publication by **Refresh native AltSource gallery**, using the already compiled Simulator app. They are uploaded only to the mutable AltSource container, with iPhone screens before landscape iPad screens. Capture failures retain previous images and cannot block binary publication.

The native jobs must succeed before binaries are published and the source feed is advertised. Packaging an unsigned IPA does not prove successful sideloading; physical-device installation and behavior remain a separate check.

## Source maintenance

Stable URL: `https://github.com/Xarber/Velunivo/releases/download/1.0/apps.json`.

`apps.json` in the repo is the initial valid empty feed. It does not invent versions before there is an IPA. The built feed uses full descriptions, developer, bundle identifier, icon, tint, category, per-device screenshots, actual version/build/date/download URL/byte size/minimum OS, all app privacy descriptions, declared entitlements and news. Previous versions remain present, newest first. No false marketplaceID, fabricated expiry or unsupported payment fields are added.

The **Refresh AltSource** workflow accepts an existing binary release tag and rebuilds metadata after source-description/script changes, replacing only the `1.0` feed/icon assets. Binary version assets stay in their respective releases. Only refresh the newest binary release; the workflow skips older versions when a newer published semantic version exists. The fixed release must stay mutable for `--clobber` uploads. Source URLs can be added to Classic/SideStore after a successful native build adds an app.

## Conventional commits and unsigned history

The new repository has `commit.gpgsign=false` and `tag.gpgsign=false` locally. Global configuration is untouched. Commit commands use `--no-gpg-sign`; no physical signing key is accessed. The release-note script groups `feat`, `fix`, `perf`, `refactor`, `ci`, `docs`, `test` and `chore`, retains scopes and flags `!` breaking changes. Unknown subjects are retained as other changes. Only changes since the previous v-prefixed semver tag are listed.

Later signing by rebase changes commit hashes. Coordinate any force push and decide whether old release tags should remain as historical artifacts. This task does not sign or rebase history.

## Add the source with AltDirect

[Open Velunivo’s source in AltDirect](https://altdirect.app/?url=https%3A%2F%2Fgithub.com%2FXarber%2FVelunivo%2Freleases%2Fdownload%2F1.0%2Fapps.json). Choose your installed sideloading app; no redirect target is forced. This points to the fixed 1.0/apps.json feed, so the link stays valid across app releases. [Official URL parameter documentation](https://github.com/StikDebug/altdirect#creating-your-link).

Release preparation pins an unsigned lightweight version tag to the exact build commit before compilation. Existing tags at a different commit fail instead of being moved. Publication requires that tag. Simulator verification uses independent runners; iPad rotates to landscape and PNG dimensions are checked. Fresh screenshots require both PID survival checks and actual landscape orientation on iPad. Screenshot verification is best effort: two bounded full capture attempts, then reuse the latest available published image. A screenshot job failure does not block publication when preparation and all binary/web builds succeed. Reused or unavailable images are disclosed in release notes, with source version and original orientation. If historical lookup fails, AltSource retains its prior per-device screenshot URLs.

Simulator screenshots pregrant foreground location and set a public Milan test location only on the fresh disposable QA Simulator, before launching the app. This avoids capturing a system permission alert. It does not modify a physical device or prove physical GPS performance. The 0.1.5 run was cancelled for a routing fix; its tag stays pinned. Use 0.1.6 for the replacement release.

Build speed: Android restores Gradle dependencies/build state with the official setup-gradle action's basic open-source cache provider and enables the local build cache. iOS enables SDK 57 C++ ccache on runners only, retaining compiler-checked entries in bounded 2 GB caches separated by Xcode/architecture and device/Simulator. Cache paths are passed as Xcode build settings so compiler subprocesses receive them. Device and Simulator builds run in parallel; Simulator verification starts independently of the device archive. The Simulator ZIP is in the ios-simulator artifact; the unsigned IPA remains in ios and ios-unsigned-early. Failed ccache installation falls back to normal compilation. Cold cache runs still compile normally; report measured gains only after runner execution. Early unsigned IPA upload remains immediately after device archiving. See IPAD-SCREENSHOT-INVESTIGATION.md for measured baseline and validation.

## 0.1.12 workflow corrections
The Android Gradle cache action runs after Expo generates native Gradle files. Simulator commands now run in owned process groups: timeouts kill their descendants and bound output draining, so a stuck cleanup cannot consume another five minutes. Fresh capture still gets two attempts before using prior published screenshots. Screenshot-only failure/cancellation does not block publication when all required binary jobs succeed. To stop an entire obsolete run, use GitHub's force-cancel endpoint (the replacement-build procedure does this).

Conventional notes split multi-clause subjects such as `feat: Scheduled navigation; fix: Speed limit` into their respective sections. The comparison baseline is the previous published version release, so failed-build tags cannot hide unreleased changes. If published release lookup is unavailable, local version tags remain a documented fallback.

## Automatic source refresh

Every successful Build and release publishes source metadata inline, so it also works for releases created using GITHUB_TOKEN (which do not trigger another workflow). Refresh AltSource additionally runs on published v-prefixed releases created manually or by another token. Older tags are skipped when a newer semantic version exists. Both paths use the same source generator and publisher.

.github/source-metadata.json is the single editable source/app description, subtitle, tint and category configuration. Every refresh overwrites source and app branding from it, resolves icons from current assets/icon.png using a content-addressed filename, reads build permissions/version/size/OS floor from the actual IPA metadata, updates available per-device screenshots and retains older screenshots when capture failed. Refreshing an already listed binary preserves its release date. Image assets upload first and apps.json last; the published JSON is downloaded and checked against the generated feed. This prevents a feed referencing an icon that has not been uploaded. No app rebuild is required for metadata-only changes.

## PWA release assets (0.1.14)

The web job generates the manifest and brand-derived PWA icons before export, then stamps the service worker with the exported shell hash. web.zip includes the installable app, manifest, worker, screenshots and metadata. Optional repository variable WEB_PUBLIC_ORIGIN fills absolute social/canonical URLs for a real deployment. Native task registration uses the custom index.js entry before Expo Router; release prebuild declares background GPS/foreground-service permissions. AltSource descriptions refresh automatically on publication from .github/source-metadata.json and current build/brand assets. Existing feed download errors fail publication instead of silently discarding version history.

Sharing builds: repository variable SHARE_ORIGIN sets EXPO_PUBLIC_SHARE_ORIGIN for all three build jobs. Official native default is https://velunivo.xcenter.it; web without an override uses its current origin. Optional PEER_HOST/PORT/PATH/SECURE/ICE_SERVERS customize self-hosted signaling and ICE. Run the repository web+PeerServer process behind TLS/WSS; a static web.zip alone does not start signaling. No PeerJS Cloud fallback. Full host/deep-link instructions: docs/SHARING.md. New native dependency react-native-webview13.16.1 requires a fresh binary; native peer behavior still needs physical-device validation.

1.0.0 injects `EXPO_PUBLIC_APP_VERSION` into every platform bundle and `APP_VERSION` into native config. Optional `OVERPASS_URL` configures road-network download service; it is a public URL, not a secret.

## Compact public release assets (October 12, 2026)

Binary releases contain exactly `Velunivo.ipa`, `Velunivo.apk`, `Velunivo-simulator.app.zip`, `web.zip` and `build_info.json`. The JSON consolidates binary byte sizes and SHA-256 hashes, compiled iOS metadata, Xcode/Android toolchain records, conventional release notes and screenshot verification diagnostics. The web bundle is also retained as a workflow artifact; the consolidated JSON links both distributions. The hosted XCenter updater was inspected: it exports from Git source and does not depend on a release `web.zip`. AltSource refresh reads compiled metadata from the consolidated JSON, with legacy compatibility for older releases.

Native screenshot galleries are published only to the mutable `1.0` AltSource release: iPhone screens first, then landscape iPad screens. README and normal binary releases contain no native screenshot assets. Failed captures preserve the previous gallery after two attempts rather than block binaries. The production IPA/APK/web do not enable Simulator screenshot fixtures.

Validation: 28 Python tests including metadata/checksum consolidation, gallery ordering and capture fallbacks pass. Native compilation remains exclusively in GitHub Actions.

## iOS dependency download recovery (1.0.13)

Run 38345157668 failed in `pod install`, before compilation: the 17.8 MB ReactNativeDependencies debug tarball from repo1.maven.org downloaded slowly for over seven minutes, then curl reported connection reset (56). The iOS and simulator jobs now use React Native's supported `ENTERPRISE_REPOSITORY` override with Maven Central's alternate HTTPS endpoint, cache its verified completed tarballs under `~/Library/Caches/ReactNative`, and configure job-local curl defaults: 20-second connect timeout, 180-second request timeout, two retries and stalled-download detection. CocoaPods retries once within a 15-minute step limit. TLS and upstream checksum checks remain enabled; failed/partial downloads are not promoted to the shared cache. No local compilation or SDK download is involved.

Both alternate-endpoint redirects and the final artifact HEAD response were checked (200, 18,746,275 bytes). Safari computer-use checks additionally verified the complete corrected app reaches Live location, and real local microphone/camera captures each become ended when disabled. These tests never record or transmit media. Camera permission wording now describes normal group video rather than a developer-only feature.

1.0.14's first queued run (38348660113) was cancelled before creating an immutable version tag after the 1.0.13 physical media report. The final revision adds shared-activity rendering, stack-based deep-link screens, session-scoped media signals and CallKit lifecycle/metadata fixes. The version can remain 1.0.14 because no v1.0.14 tag exists. Detailed verification and remaining native-device checks are in GROUP-RIDING.md. The hosted PeerServer protocol/package is unchanged; update hosted web assets alongside the native app.

Final pre-push validation: 287 JavaScript tests and 31 Python tests pass; TypeScript, Expo lint and diff whitespace checks pass. Real browser media, full-app group/GPS and route-auto-load checks pass. Native compilation remains exclusively on GitHub. Existing simulator regular-vs-shared link behavior was observed through Device Hub; fixed native UI needs the replacement artifact.

1.0.15 incorporates the full 1.0.14 fixes and the final older-client ICE regression fix. Native/hosted web clients should both update. The 1.0.14 run 38350687068 was cancelled and force-cancelled before starting its replacement. Device Hub confirmed cold/warm shared-trip link routing with new JavaScript in the existing native binary; the original simulator app was restored after the test. No local native compilation or SDK download.

1.0.16 incorporates native negotiated-sender binding, CallKit-owned activation, automatic shared-route starts, recording activities, group/spectator badges, loading feedback and conservative live trace fitting. See GROUP-RIDING.md for verification limits. Version 1.0.15 completed successfully; no active previous release run remains to cancel. Do not move existing version tags. Native compilation remains on GitHub only. Local regression checks run with test concurrency 2 after the Mac memory/disk pressure; no SDK/runtime was downloaded.

Pre-push verification for 1.0.16: 296 JS tests, 31 Python tests, TypeScript, Expo lint and whitespace checks. Native changes are not locally compiled. The post-interruption browser UI smoke rerun hit a sandbox startup restriction; earlier actual RTP/media tests and the new intent/trace/activity regression tests are documented separately. After cleanup the Mac had approximately 6.5 GiB free; no additional SDK was installed.

## Expanded Dynamic Island layout (1.0.17)

The expanded Island groups a larger 32-point maneuver symbol and 24-point distance on the left, rather than separating the distance on the right. Guidance and arrival details align to the left across the bottom region. Compact/minimal Island and Lock Screen layouts retain their current sizing. Both the direct Swift renderer and Expo layout agree. No SDK downloads or local native compilation; native appearance requires the new CI binary.

Also removes a duplicate microphone-button disabled property accidentally introduced after 1.0.16's verification, which prevented its type/lint checks from passing.

## Expanded Island refinement (1.0.18)

Per the clarified layout, expanded leading now stacks a 36-point direction arrow above a smaller 16-point distance. Compact/minimal Island, Lock Screen and all activity data remain unchanged. Version 1.0.16's duplicate microphone property failure was already fixed in 1.0.17. Cancel the active 1.0.17 build when starting the replacement; do not move its version tag. No local native compilation or SDK download.

## Android Live Updates compilation repair

Run 38362103801 failed Android Kotlin compilation at VelunivoLiveUpdatesModule.kt:66: adding the recording ID to the supported-ID set had also inadvertently changed a timeout equality check into an invalid comma-separated expression. Restore the timeout check to the test activity only; recording retains the normal renewable 90-second timeout. iPhone compilation succeeded; leave this run and its simulator job running as requested. This repair is prepared locally without dispatching another workflow or compiling locally.

Published as 1.0.19 using a new immutable tag. The user obtained the 1.0.18 simulator artifact and authorized cancelling its remaining work before dispatching the replacement. Validation: TypeScript, Expo lint, data-transfer/version regressions and whitespace checks; native compilation is exclusively performed by GitHub Actions.

1.0.20 adds recording-group automatic start, recording Island symbol/timer, safer activity padding and further native sender/CallKit metadata hardening. Shared-trip/navigation activity values remain unchanged. See GROUP-RIDING.md for the exact scope and physical validation limits. The requested second-simulator test is deferred.

Pre-push checks for 1.0.20: 300 JavaScript regressions pass at concurrency 2; TypeScript, Expo lint and whitespace checks pass. Native sender, CallKit and Island appearance still require the new binary and later device tests.

1.0.21 replaces any current navigation/recording on group admission, saves before handoff, allows joining while navigating, and keeps membership until the newly started group activity ends. Group creation requires an active ride. See GROUP-RIDING.md for behavior and verification limits.

Validation: all 307 JS regressions passed, including seven new activity-handoff cases. After the final change restricting location publication to active sessions, TypeScript, lint, 15 group regressions and diff whitespace checks passed again. No local native compilation, SDK downloads or simulator creation.

## GPS speed and group recovery (1.0.22)

Web previously relied on the browser-provided speed, which may be absent. Navigation and explicit recording now share an accuracy-aware GPS travel-distance/time estimator on web, and native uses it when a valid GPS-reported speed is absent. Stationary deadzones, invalid fixes, gaps and implausible jumps cannot become meaningful speed. Estimated readings have yellow text beneath the speed; Bluetooth speed retains priority. Per-fix provenance and the original browser/GPS speed are retained, and new recorded summaries/replays warn when estimates were used. The persisted metadata is additive and optional, preserving older rides without inventing provenance.

Travel direction was already a compass fallback. It now also derives course from sustained movement when GPS reports speed but no heading, while respecting an authoritative stopped-speed reading. Group rejoin/media startup and rider-list video improvements are documented in GROUP-RIDING.md. 313 JavaScript regressions, TypeScript, Expo lint and whitespace checks pass. Native media/CallKit still need real-device retesting in the new binary. No computer use or new SDK.

1.0.23 restores the initial iOS CallKit session lifetime without reverting working media fixes. The hangup button now uses a red downward handset outline. See GROUP-RIDING.md for the comparison, regression coverage and native-device validation boundary. Native builds remain exclusively on GitHub.

1.0.23 validation: 314 JS tests, TypeScript, Expo lint and diff whitespace checks pass. The native-factory regression verifies consent-time iOS call registration, retained idle call, no capture while alone, mute capture teardown, native end forwarding and final call teardown. Actual lock-screen/system-call UI needs phone verification in the new binary.

## 1.2.0

Version 1.2.0 was explicitly requested. It adds one pinned remote camera preview, per-recipient priority encoding, local camera preview in the rider list, group participant-only recording metadata/replay, and visible privacy explanations. CallKit system UI has separate participant/connecting/connected phases; media capture stays tied to actual connected recipients. The existing mutable AltSource tag remains 1.0; the binary release tag is v1.2.0. Older recordings receive no invented roster; additive metadata stays compatible. No hosted PeerServer implementation change, SDK download, local native compilation or computer use. The previous 1.0.23 workflow is already cancelled; do not restart or move its tag.

1.2.0 final verification: 321 JavaScript tests pass (concurrency 2), plus TypeScript, Expo lint and whitespace checks. New coverage exercises clickable stable web video pins, single-target quality signaling, per-sender encoder limits, local stream reuse, participant/connected CallKit boundaries, capture teardown, roster privacy/bounds and import validation. Actual native system UI, simultaneous native rendering and codec adaptation remain physical-device validation items. No desktop interaction, new simulator, SDK download or local native compilation.

## Version policy (1.2.1 onward)

Use `Major.Minor.Fixes`: the owner explicitly authorizes major increments. Substantial features use a minor release (group two substantial features where practical); fixes and small additions use a patch. This update is **1.2.1**. The mutable AltSource release remains `1.0`; binaries use `v1.2.1`.

What's New presents at most three concise highlights. Patch changes are grouped into one **Fixes & Improvements** highlight, only when a slot is available. Complete changes remain in `releaseDetails`, independently of curated `releaseHighlights`; Settings → What's New → Show full changelog opens a version-specific submenu. Historical details are retained even when four older highlights are reduced to three in the overview.

### 1.2.1 implementation and validation

- Native location-service speed retains priority over coordinate-derived estimates; Bluetooth speed still takes precedence. A missing or stationary startup estimate no longer marks a recording inaccurate. Live badges use only the compact yellow **Estimated** label when a numeric coordinate-derived estimate is available. Accelerometers do not independently measure reliable ground speed.
- Explicit rejected-token errors pause automatic authentication and offer **Pair again**, including a notice in expanded ride telemetry. Fresh registration uses a new credential object; previous credentials remain until identity verification and secure persistence succeed. Other permission, radio and timeout errors do not invalidate credentials.
- A remote rider's active camera can be pinned/unpinned from the rider list, using the same existing stream and preview as map-pin selection. CallKit, WebRTC and capture lifecycle implementations are unchanged.
- The hidden Developer Mode card appears below the version and retains its triple-tap/timeout behavior. Developer Options has separate simulation, telemetry, Bluetooth diagnostics, activity tests, ride diagnostics, analytics, and reset pages.
- Read-only analytics show record/sample totals, Bluetooth interruptions and speed-source distribution of the latest ride. They expose no tokens or API keys. Activity tests select navigation, recording or shared-trip sample content and customize distances, duration, battery and group/viewer counts. Tests retain their isolated factory and never end actual rides. Shared-trip demos omit vehicle battery.
- Added English-source strings and natural translations in Italian, Spanish, French, German and Portuguese. No dependencies added. Native binaries built only through GitHub Actions; no local native compilation, SDK installation or computer-use actions.

Hardware limitation: credential-rejection and replacement are verified with protocol/bridge fixtures, not a new physical Pro 2 pairing. Lock Screen appearance must be checked in the resulting native build. Existing 1.2.0 release completed successfully before this update.

Validation completed before push: **329 JavaScript/TypeScript tests passed**, including new credential replacement/rollback, speed provenance, activity sample, release-history and developer-placement tests; lint and typecheck passed without warnings; `git diff --check` passed. CallKit, voice/media factories and native call modules have no changes in this update.

## 2.0.0

The user explicitly authorized a major release for ride-only exploration, exploration route alternatives, maintenance reminders and profile ride statistics. Native GitHub update checks, saved-profile group setup and retrospective changelog formatting are included. See [implementation and validation](EXPLORATION_2.0.md). Historical tags are unchanged; the mutable `1.0` source release remains separate from `v2.0.0` binaries. CallKit/media/protocol implementations are unchanged, no local native build or SDK download occurred, and new QA screenshots are not added to README/release assets.

## 2.0.1 — native startup compatibility

The 2.0.0 scratch-map dependency, h3-js 4.5.0, eagerly constructs a UTF-16LE TextDecoder while importing its compiled JavaScript. Hermes rejects that encoding, preventing Expo Router from loading screens. This is unrelated to saved tiles or route data.

`scripts/patch-h3.mjs` runs first during postinstall and guards only that optional decoder initializer in all four CommonJS/ES module and browser entry bundles. H3 4.5.0 never uses the UTF16Decoder variable; its geographic calculations remain unchanged. The platform's global TextDecoder and UTF-8 implementation are untouched. The patch verifies the dependency version and source shape, is idempotent, and fails clearly if an upstream change needs review.

`tests/h3-native-decoder.test.mjs` loads the actual dependency bundles with a UTF-8-only decoder: the original source reproduces the reported exception; patched code imports and calculates cells, boundaries and contiguous polygons. It also checks full decoder support, no TextDecoder, repeated installation and all patched entry points. Version metadata and localized What's New are updated to 2.0.1. No native APIs, CallKit/media code or stored schemas changed. No local native compilation or SDK download is performed.

Validation: lint, typecheck, 346 JavaScript/TypeScript tests, 31 Python workflow tests (Python 3.13), diff whitespace checks and the production iOS JavaScript/Hermes bundle export passed. The export bundles JavaScript only; it does not compile an Xcode app. Installed-device startup verification remains pending the replacement IPA.

## 2.0.2 — scratch map presentation

- Wider map extents gradually enlarge the displayed explored outlines by up to 40 metres. The enlargement uses local edge normals, not parent H3 cells or whole districts, and never changes tile IDs, timestamps or visited-area statistics. Unvisited islands remain covered. Close street-level views retain the original outline. Corner rounding uses a slightly smaller cut (17% instead of 20%, still two smoothing passes).
- All three map renderers use a brighter mint boundary with a 1.8-point/pixel line. Riding fill opacity increases from 14% to 26%, with a 60% boundary opacity; non-riding fill remains 34%. Route lines and markers retain their layer priority.
- The standalone viewer reuses foreground location while open, displays the current-position marker, and opens once around a roughly 3 km local area. Subsequent fixes update the marker without fighting user panning. A locate action recentres explicitly. Without a fix it retains the explored-area fallback; recap initially frames new tiles. Viewing does not collect scratch cells and creates no background tracking session.
- Full-screen recording preflight uses the home context, active recording and replay use the ride context, and full-screen shared previews, saved-place picking and map-area selection use the home context. Preferences still decide visibility; small Library preview cards stay uncluttered.

Validation: lint/typecheck, 347 app tests, production web export and isolated headless Chrome checks. GPS was emulated in Rome with an additional distant explored tile: the viewer opened at the Rome marker, browsing left tile data unchanged, pre-recording and active recording rendered with fog, and no page errors occurred. Reviewed screenshots at opening, wider zoom, pre-recording and recording. Unit coverage verifies the 40 m cap, ring direction and unchanged persisted tiles. No local native compilation, SDK installation or user-browser automation. Physical iOS/Android appearance still needs installed-build verification.

## CI / AltSource reliability repair (13 October 2026)

Inspected release run `38422328519`: prepare, Android, iPhone, Simulator, web and publication succeeded. Its iPad verification job never acquired a hosted runner (runner ID 0); GitHub check annotations report macOS ARM capacity constraints. This cancellation made the overall release run fail despite successful publication and prevented the old success-only gallery trigger from running. Earlier gallery run `38414955516` failed on timed-out installation and on an orientation command that advertised support but rejected the selected simulated device.

- Removed optional screenshot jobs from the binary workflow. Build publication now depends only on required binary jobs. Existing images remain in the feed until the separate gallery completes. The in-progress 2.0.2 build retains its already loaded workflow; these workflow changes apply to subsequent dispatches.
- Gallery identification checks successful publication rather than assuming the whole source run is green. Captures iPhone and iPad sequentially on one Xcode 27 host, reducing runner demand, and invokes historical fallback after two failures. Old/missing/incomplete/wrong-version galleries now produce a notice and leave the source unchanged. Both fresh, correctly oriented four-screen galleries are still mandatory before replacement.
- Capture attempts are capped at four minutes each; optional full-system boot readiness is capped at 30 seconds. Device Hub orientation/payload commands fall back to actual simulated-device UI/simctl when rejected. Failed command output is retained for diagnosis. Historical screenshot lookup has a total 90-second budget.
- Gallery publication shares the source-update concurrency lock. Refreshing screenshots preserves conventional release descriptions and original release dates from `build_info.json` or the existing feed, instead of replacing them with a generic version label.

Added regression coverage for fallback routing, complete-gallery publication, landscape enforcement, stale version protection, binary/screenshot separation and release-note preservation. Local Python workflow tests, lint and type checks pass. No app code, version number, native compilation or local simulator sessions changed. GitHub runner availability remains external; a runner-allocation failure in the independent gallery can still require a retry without affecting binaries or source metadata.
