# 2.6.1 implementation and verification checklist

## Native/map regressions
- [ ] Resize recenter implemented; unfolded Duo landscape gate corrected, final native retest pending.
- [x] Native arrow visibly rendered in the existing Duo candidate Simulator.
- [x] Web marker badges; centered native halo avatar; all pins retain faces.
- [x] Safari-compatible continuous map location without hiding on ordinary update gaps.
- [ ] Settings return owner implemented; Duo exposed a second reset in Store, now fixed; retest final artifact.
- [ ] Portrait accessory centered and verified; real Duo toolbar rail path implemented, awaiting CI artifact test.
- [ ] Landscape placement implemented; unfolded Duo height gate fixed after native test, awaiting retest.
- [ ] First-render absolute animation disabled; native reproduction/verification pending.

## Battery
- [x] Vehicle list and detail show live/last reading with clear provenance.
- [x] Trustworthy disconnected ride estimate only: recent real reading and >=10 qualified BT rides.
- [x] Gradual consumption using learned context; no assumed-charge UI fallback.
- [x] Manual post-ride battery answer updates last reading once.

## Library and developer fixtures
- [x] Memories/downloaded maps use preview cards; Show all tile only for >3 items.
- [x] Memories full map preview and stacked consenting rider faces above title.
- [x] Developer sample-data toggle; screenshot mode enables it automatically; isolate fake data.
- [x] Five ghost riders with varied cosmetics, no real peer/media transmission.

## Analytics completion
- [x] Historical acceleration and speed-calibration trends.
- [x] Evidence/confidence-based anomaly detection and efficiency recommendations.
- [x] Per-sensor reliability and normalized historical comparisons.

## Screenshots/release
- [ ] Audit previous screenshot work and current capture failures.
- [ ] Genuine native phone/tablet screenshots; iPad landscape; one booted simulator at a time.
- [ ] Correct frames (iPhone 17 Pro from supplied iFrames; Android native frames), safe areas, welcome tour.
- [ ] Phone/tablet screenshots for Android distribution metadata; AltSource iPhone before iPad.
- [ ] No screenshots in README/binary release assets.
- [ ] Automated tests/lint/types and native validation evidence distinguished.
- [ ] Unsigned descriptive commits, build, matching hosted web, rollback and PeerServer checks.
