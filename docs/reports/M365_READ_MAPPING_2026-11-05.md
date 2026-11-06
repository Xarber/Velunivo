# Controlled SHFW read mappings — 5 November 2026

## Outcome and scope

The original requested read mappings are identified on the physical scooter reported by ScooterHacking Utility 4.2.1 #78 as Mi Electric Scooter Pro 2 / SHFW 3.12.2. Computer Use operated Utility; the original Velunivo probe authenticated and read the scooter independently between Utility sessions. No Utility implementation was copied. No independent configuration write was implemented or tested. This report supersedes the earlier report's unresolved timeout/profile-field locations; it does not extend results to other firmware.

The diagnostic tool now uses revision `readonly-shfw-3`: the previous ten fixed reads plus sixteen 32-byte reads at word starts 0, 16, …, 240. This bounded survey covers 512 response bytes, with overlapping reads for cross-checking. It remains separate from production UI and has no configuration write control. See [operation and safeguards](../M365_INSPECTION.md) and [earlier Profile 1 comparison](M365_INDEPENDENT_PROTOCOL_2026-11-05.md).

## Measured read correlations

All offsets below are zero-based **byte offsets inside the response data**, excluding the three-byte reply header. Words are interpreted as unsigned 16-bit little-endian values. The word index is calculated as read start + byte offset / 2. Every overlapping named block matched the canonical window slice in all seven evening snapshots, supporting word addressing for these observed reads. Except for activeProfile, no dedicated two-byte read at each derived word index was tested. These are read locations, not a verified write ABI.

| Field | Observed read start + byte offset | Word index | Controlled difference |
| --- | --- | --- | --- |
| Profile 1 Always on headlight | 17 + 10 (earlier controlled session) | 22 / `0x16` | `0x0362 → 0x0366`, mask `0x0004` |
| Profile 2 Always on headlight | 76 + 10; 80 + 2 | 81 / `0x51` | `0x03E2 → 0x03E6`, mask `0x0004` |
| Profile 3 Always on headlight | 135 + 10; 128 + 24 | 140 / `0x8C` | `0x0362 → 0x0366`, mask `0x0004` |
| Active profile | 178 + 0; 176 + 4 | 178 / `0xB2` | `3 → 2 → 3`; earlier user switching also correlated with `3 → 1 → 3` |
| Normal shutdown | 240 + 14 | 247 / `0xF7` | `5 → 6 → 5`, minutes, observed one-to-one values |
| Locked shutdown | 240 + 16 | 248 / `0xF8` | `300 → 290 → 300`, minutes, observed one-to-one values |

Utility displayed normal timer constraints 0–30 minutes, step 1, and locked timer 0–300 minutes, step 10, both with 0 = Off. Only the values above were physically read after changes. Zero, full ranges, elapsed shutdown behavior and persistence across a scooter power cycle were not tested. Profile editor selection is distinct from the running profile: the active-profile test used Utility's Global Active profile control.

The light field is **Always on headlight**, not a symmetric immediate lamp switch. Earlier user observations established that enabling Profile 3 illuminated the front lamp, but disabling the flag left the lamp on until a physical button press. Preserve this semantic distinction when designing controls. The other bits in the word must be preserved; the differing baseline words across profiles show why whole-word constants would be inappropriate.

## Controlled sequence and restoration

Each completed evening snapshot contains 26/26 blocks, no reported failed blocks, speed 0 m/s and battery 100%. Compared with the original baseline, each temporary snapshot differs at only the one word named below. Named overlapping blocks repeat the same difference; those are not additional changed settings.

| Snapshot | Start time UTC | Difference from baseline | SHA-256 |
| --- | --- | --- | --- |
| `baseline.json` | `2026-11-05T19:40:12.226Z` | None | `a3181a1917b0bc87a22f79dcae8f460cb38751da14f8e8884cd939e2943d83a8` |
| `normal6.json` | `2026-11-05T19:47:09.318Z` | Word 247: 5 → 6 | `4d00a2d19a563703c010e8c9027cf017fcb09bdbcc416de0cbdb18d01a999cb9` |
| `locked290.json` | `2026-11-05T19:51:58.668Z` | Word 248: 300 → 290; normal restored | `05ed02708a82177da33063df654a9d9630607b1032e99035030b9271de6ac2cb` |
| `profile2-on.json` | `2026-11-05T19:57:11.776Z` | Word 81: mask 0x0004 enabled; timers restored | `bfa0f0ec914744407343b0c6392aaad3d8e0668266c384790308069b9117d250` |
| `active2.json` | `2026-11-05T20:01:50.836Z` | Word 178: 3 → 2; Profile 2 light flag restored | `e0310c9b2cafd81be82c15f9a443e65db2ee4413a08f8bdaa9f08cd0db6be77f` |
| `profile3-on.json` | `2026-11-05T20:05:43.576Z` | Word 140: mask 0x0004 enabled; active profile restored to 3 | `51c7ab62e9fd0acc5731935b7e8f61a5b16b1bf9217d2c4be828e0a454b59877` |
| `restored.json` | `2026-11-05T20:13:11.746Z` | None: exact byte match in all 26 blocks | `280d0267b26a1f5ad599049745bd70682baec1fad2a02b9fb80fb8415dff6975` |

The final restored reading at `2026-11-05T20:13:11.746Z` exactly matches baseline in every response byte, with identical block keys, register numbers and lengths. The full canonical 512-byte window also matches. This verifies the captured configuration scope, not all possible scooter storage. Utility freshly displayed normal 5 minutes, locked 300 minutes, active Profile 3 and Profile 3's Always on headlight Off before the final independent reconnect. All three always-on flags are back to their original Off values. The user confirmed the headlight off before that final approval retry; a final physical confirmation after successful pairing is pending.

Utility was disconnected before probe reads. Both clients were disconnected afterward, and the probe was reloaded to clear its in-memory pairing token and raw display. As disclosed before authorization, the scooter's persistent Xiaomi registration may still require pairing again in Utility; clearing the page is not an undo of scooter registration. No motor, throttle, brake, current, speed-limit, firmware, serial, region, boot-trigger or lock setting was deliberately changed. Profile copying/reset/import and restorable backup remain untested.

## Private capture evidence

Raw snapshots, the comparison summary and a SHA-256 manifest are stored outside Git at `/Users/xarber/Documents/Codex/2026-11-05/velunivo-independent-inspection/mapping-window/`, with owner-only directory/file permissions. Original Downloads files remain intact. A retained `velunivo-restored-timers.png` shows Utility's restored timers. Raw responses may contain private settings and are not a restorable backup.

Original passive observers wrapped the standard Web Bluetooth write methods and attached notification listeners, after authentication and before changing settings. They were removed before disconnect/re-registration. These record encrypted GATT chunks, not plaintext commands or proven acknowledgment counts. Captures include neighboring menu reads and notifications; do not replay ciphertext or infer a complete write layout from chunk counts.

| Capture file | GATT events | SHA-256 |
| --- | ---: | --- |
| `velunivo-map-active-restore3-trace.json` | 14 | `6c0410897e074df973c4552b3a98b6b301c0b0f47445da6a42a0322a2d58f269` |
| `velunivo-map-active2-trace.json` | 18 | `79a4cc35ad7759ca8f10e941312da965edbf56b87d5860e3e76cf0c84b7d5af9` |
| `velunivo-map-locked-restore300-trace.json` | 15 | `00331659febbb99a15a12cbf3c377ca28d68ab7839c1cecc1281a5182c41480a` |
| `velunivo-map-locked290-trace.json` | 14 | `bc3ac124e818efedc0dc0ab760690455a91ca7764a1ce9328ac149aa1d75c2aa` |
| `velunivo-map-normal-restore5-trace.json` | 14 | `cc44db51a2eca2e3ffa356c3e8d993bafd6af7723b7733e627342d620c48895a` |
| `velunivo-map-normal6-trace.json` | 14 | `55eb3f733f3e634770816b302130e9e2f4dee28a9867c08a2d7743ae7991603d` |
| `velunivo-map-profile2-on-trace.json` | 22 | `e9bcc35159f5a7abda5caa49a7874b0a938f6343de18f82fbc675807d9a86d38` |
| `velunivo-map-profile2-restore-off-trace.json` | 12 | `e3fbcfd08fa5751bb25c2789b9aaca2cfd031652de7bc7c3566881837d76d6b6` |
| `velunivo-map-profile3-on-trace.json` | 12 | `89182f5ee17465b5553e1f5107db99bdb1b5cbf8adf92292670f5df379e04386` |
| `velunivo-map-profile3-restore-off-trace.json` | 22 | `372e255414e646afda802c70dcca7bcd037c5b2ea4bb727661ec574dd2a68ee7` |

## Validation, implementation gate and release scope

The seven inspection tests and existing Mi authentication, request and browser transport suites passed: **26 tests, zero failures**. They cover the immutable read allowlist, full bounded survey, authenticated fragmented replies, response matching, cancellation, movement rejection, secret exclusion and existing transport/authentication behavior. Lint and TypeScript checks passed for the survey implementation. The first normal6 attempt timed out on telemetry; a manual read retry produced the complete snapshot above. Registration/approval retries were required; failures were not labeled successful captures.

The mappings are ready to inform an independent implementation. Production writes remain disabled until a separate authorized implementation establishes exact write framing and acknowledgment semantics, a reliable model/firmware gate (spoofable ordinary version bytes are insufficient), fresh read-modify-write preserving neighboring bits, verified read-back, restoration and interruption recovery. Test those independent controls on the physical scooter before claiming they work. Direct headlight-off, full profile editing/backup, other firmware and actual timer expiry remain unverified.

No native app source, dependency, version, release channel or hosted deployment was changed. No iOS unsigned IPA, iOS Simulator, Android APK/AAB, app release or production deployment was requested or run. This is browser/physical-scooter read research and original diagnostic tooling. The mapping branch initially had no project Ideas collection. At final integration, newer development work supplied `docs/IDEAS.json`: the repository collection contains one already-implemented notebook idea and no pending, approved or deferred entries. No on-device Ideas retrieval is claimed. Integration preserved that newer work and resolved the documentation-index conflict by retaining both links.
