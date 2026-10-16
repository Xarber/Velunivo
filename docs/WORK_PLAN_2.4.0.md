# 2.4.0 work plan

Requested 16 October 2026. Preserve existing working behavior, unsigned conventional commits, native builds only in CI, no local native compilation/SDK download, own isolated browser only, matching hosted web update and rollback.

Priority order:
- [ ] Diagnose and prove fresh iPhone Pro / 11-inch iPad Pro screenshot workflow, landscape iPad; screenshot failure never blocks binaries.
- [ ] Smooth short scratch reveal, no persistent replay flashing.
- [ ] Group lock + reconnect admission, leader approval, join banner/Live Activity and useful opt-in local notifications.
- [ ] Frequent rides near their actual start, sufficient repeated rides, compact library Show all cards/details.
- [ ] Five-device mesh syncing, deletion tombstones, preserved modification timestamps, disconnected unpair/revocation.
- [ ] Map arrow/camera rotation synchronization and calibrated replay heading.
- [ ] Charging battery badge and connected vehicle battery in pickers/planning.
- [ ] More achievements, daily/nearby-neighborhood challenges, cosmetic-only rewards/themes.
- [ ] Live Activity developer scenario coverage and straightforward bottom action rows.
- [ ] Adaptive iPad brand/tab row, separate full-screen welcome tour/What's New, real app screenshots in regular Pro device mockups.
- [ ] Localizations, regressions, responsive/low-end browser checks, CI, hosted deployment, concise feature suggestions.

Baseline: 2.3.2 / 11a0301. Native build 38625449873 succeeded. Gallery 38628316560 reused iPhone images and produced no fresh iPad images: simctl bootstatus timed out, install timed out, then clone/create/shutdown/delete all stalled. Investigate runner CoreSimulator boot health rather than blaming iPad layout. Benchmark tooling fix from prior turn is uncommitted and must be preserved.

Capture diagnostic 38859249274: clean Pro devices + Device Hub still stall in installation on the 7 GB hosted runner. Test matching installed Xcode 27.0 runtime tools next; native compilation remains on beta. No local runtime or compilation.
