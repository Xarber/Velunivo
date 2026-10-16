# 2.4.0 work plan

Requested 16 October 2026. Preserve existing working behavior, unsigned conventional commits, native builds only in CI, no local native compilation/SDK download, own isolated browser only, matching hosted web update and rollback.

Priority order:
- [ ] Diagnose and prove fresh iPhone Pro / 11-inch iPad Pro screenshot workflow, landscape iPad; screenshot failure never blocks binaries.
- [x] Smooth short scratch reveal, no persistent replay flashing.
- [x] Group lock + reconnect admission, leader approval, join banner/Live Activity and useful opt-in local notifications.
- [x] Frequent rides near their actual start, sufficient repeated rides, compact library Show all cards/details.
- [x] Five-device mesh syncing, deletion tombstones, preserved modification timestamps, disconnected unpair/revocation.
- [x] Map arrow/camera rotation synchronization and calibrated replay heading.
- [x] Charging battery badge and connected vehicle battery in pickers/planning.
- [x] More achievements, daily/nearby-neighborhood challenges, cosmetic-only rewards/themes.
- [x] Live Activity developer scenario coverage and straightforward bottom action rows.
- [x] Adaptive iPad brand/tab row, separate full-screen welcome tour/What's New, real app screenshots in regular Pro device mockups.
- [ ] Localizations, regressions, responsive/low-end browser checks, CI, hosted deployment, concise feature suggestions.

Baseline: 2.3.2 / 11a0301. Native build 38625449873 succeeded. Gallery 38628316560 reused iPhone images and produced no fresh iPad images: simctl bootstatus timed out, install timed out, then clone/create/shutdown/delete all stalled. Investigate runner CoreSimulator boot health rather than blaming iPad layout. Benchmark tooling fix from prior turn is uncommitted and must be preserved.

Capture diagnostic 38859249274: clean Pro devices + Device Hub still stall in installation on the 7 GB hosted runner. Test matching installed Xcode 27.0 runtime tools next; native compilation remains on beta. No local runtime or compilation.

Higher-memory capture 38860575731 could not start (GitHub account spending limit); no billing changes. Headless extended-boot test 38860724633 still pending. Test existing ARM Simulator binary on the stable macOS 26 capture image next; release compilation stays Xcode beta. This separates Simulator OS startup from compilation and downloads no runtime.

Resumed after the requested pause. Implementation and current validation are in UPDATE_2.4.0.md. Screenshot/CI publication and final hosted deployment remain gated on fresh native capture verification.

## Usage-break handoff — 16 October

User requested starting the 2.4.0 build immediately and deferring screenshots. Native phone/iPad tour previews now use verified iOS/iPadOS 27 Simulator framebuffers from an existing 2.3.2 CI binary. Web previews have their own browser decoration. Android phone previews remain genuine Android 16 captures; Android tablet previews are omitted until verified rather than substituting browser imagery or a placeholder. Provenance is recorded beside assets. Screenshot workflows are temporarily manual-only so the new release will not restart deferred capture work; binary publication remains independent.

Latest screenshot issue: Android 17 emulator SurfaceFlinger aborts in mapper.ranchu `hasReadColorBufferDma`, causing system-server restarts and misleading missing-activity errors. Software GPU alone did not solve it. Relevant primary maintainer issue: https://github.com/actions/runner-images/issues/14484 describes tools 22.0 and correct `target=android-37.0` AVD metadata eliminating the same crash; investigate that before another run. Tools 23.0's Android CLI wrapper was selected in recent attempts. Do not claim fresh Android 17 images exist. Native iOS 27 capture works locally without compilation, but the 7 GB hosted beta runner still stalls at installation/create; larger runner execution was rejected by account spending limit. Billing unchanged.

Application tests: 416 passing. Python tooling: 46 passing with Python 3.14. Lint/typecheck passed before the final omitted-preview guard; final build prepare repeats all required checks. Remaining: fresh CI galleries, Android phone/tablet distribution images, final native feature checks, final matching hosted web revision confirmation and release wrap-up. Do not compile native code locally.
