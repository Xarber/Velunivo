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
- iPhone/iPad screenshots captured from the built Simulator app (or explicitly disclosed historical screenshots on capture failure), real byte sizes, version/build/minimum OS/permission metadata, build-tool records, conventional release notes and SHA256SUMS.

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

Binary releases contain exactly `Velunivo.ipa`, `Velunivo.apk`, `Velunivo-simulator.app.zip` and `build_info.json`. The JSON consolidates binary byte sizes and SHA-256 hashes, compiled iOS metadata, Xcode/Android toolchain records, conventional release notes and screenshot verification diagnostics. Web bundles remain GitHub Actions artifacts, linked through the JSON's workflow run. The hosted XCenter updater was inspected: it exports from Git source and does not depend on a release `web.zip`. AltSource refresh reads compiled metadata from the consolidated JSON, with legacy compatibility for older releases.

Native screenshot galleries are published only to the mutable `1.0` AltSource release: iPhone screens first, then landscape iPad screens. README and normal binary releases contain no native screenshot assets. Failed captures preserve the previous gallery after two attempts rather than block binaries. The production IPA/APK/web do not enable Simulator screenshot fixtures.

Validation: 28 Python tests including metadata/checksum consolidation, gallery ordering and capture fallbacks pass. Native compilation remains exclusively in GitHub Actions.
