# GitHub builds and releases

No EAS submission and no local SDK downloads. The workflows are ordinary Expo prebuild + Xcode/Gradle builds on GitHub runners.

## Repository configuration

Actions must be enabled. Workflows have minimum default read permission; publishing jobs request contents write. Do not enable immutable releases for the special `1.0` source-feed container, because its assets are intentionally replaced at a fixed URL. The feed tag is never moved. Published binary releases use immutable version tags; do not reuse a binary version.

Optional repository variables: `ROUTING_URL` (HTTPS private-key proxy), `MAP_STYLE_URL` (public restricted map-style URL), `ALLOW_OFFLINE_DOWNLOADS` (`true` only when licensed). No configured variables means an empty planner with GPX import/simulation, online key-free maps, Photon address search and Valhalla public routing. Live TomTom traffic remains unavailable without a server key. The public routing demos are for fair-use development; production should configure a durable HTTPS proxy/provider. Server keys are configured on your separately deployed server, not in the public repo or app bundle.


Optional Android signing secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Keep a stable keystore for upgrades. Without them, the native template's development signing key is used; the release notes state this. iOS builds are unsigned and packaged for AltStore Classic/SideStore to re-sign. No Apple certificate or physical security key is requested. This is not App Store/PAL notarized distribution.

## Run a release

Either push an unsigned lightweight tag `v0.1.0`, or dispatch **Build and release** with version `0.1.0`. The first successful run creates the matching binary release and updates the `1.0` feed release. Every build validates lint/types/tests first. APP_VERSION is injected from the validated version; BUILD_NUMBER is the Actions run number. The IPA's actual Info.plist is checked against the tag before its source entry is created.

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

The **Refresh AltSource** workflow accepts an existing binary release tag and rebuilds metadata after source-description/script changes, replacing only the `1.0` feed/icon assets. Binary version assets stay in their respective releases. Only refresh the newest binary release; the script will otherwise promote that selected release to first in version order. The fixed release must stay mutable for `--clobber` uploads. Source URLs can be added to Classic/SideStore after a successful native build adds an app.

## Conventional commits and unsigned history

The new repository has `commit.gpgsign=false` and `tag.gpgsign=false` locally. Global configuration is untouched. Commit commands use `--no-gpg-sign`; no physical signing key is accessed. The release-note script groups `feat`, `fix`, `perf`, `refactor`, `ci`, `docs`, `test` and `chore`, retains scopes and flags `!` breaking changes. Unknown subjects are retained as other changes. Only changes since the previous v-prefixed semver tag are listed.

Later signing by rebase changes commit hashes. Coordinate any force push and decide whether old release tags should remain as historical artifacts. This task does not sign or rebase history.

## Add the source with AltDirect

[Open Velunivo’s source in AltDirect](https://altdirect.app/?url=https%3A%2F%2Fgithub.com%2FXarber%2FVelunivo%2Freleases%2Fdownload%2F1.0%2Fapps.json). Choose your installed sideloading app; no redirect target is forced. This points to the fixed 1.0/apps.json feed, so the link stays valid across app releases. [Official URL parameter documentation](https://github.com/StikDebug/altdirect#creating-your-link).

Release preparation pins an unsigned lightweight version tag to the exact build commit before compilation. Existing tags at a different commit fail instead of being moved. Publication requires that tag. Simulator verification uses independent runners; iPad rotates to landscape and PNG dimensions are checked. Fresh screenshots require both PID survival checks and actual landscape orientation on iPad. Screenshot verification is best effort: two bounded full capture attempts, then reuse the latest available published image. A screenshot job failure does not block publication when preparation and all binary/web builds succeed. Reused or unavailable images are disclosed in release notes, with source version and original orientation. If historical lookup fails, AltSource retains its prior per-device screenshot URLs.

Simulator screenshots pregrant foreground location and set a public Milan test location only on the fresh disposable QA Simulator, before launching the app. This avoids capturing a system permission alert. It does not modify a physical device or prove physical GPS performance. The 0.1.5 run was cancelled for a routing fix; its tag stays pinned. Use 0.1.6 for the replacement release.

Build speed: Android restores Gradle dependencies/build state with the official setup-gradle action's basic open-source cache provider and enables the local build cache. iOS optionally enables SDK 57 C++ ccache on runners only, retaining compiler-checked entries in a 1 GB cache separated by Xcode/architecture. Failed ccache installation falls back to normal compilation. Cold cache runs still compile normally; report measured gains only after runner execution. Early unsigned IPA upload remains before Simulator compilation.
