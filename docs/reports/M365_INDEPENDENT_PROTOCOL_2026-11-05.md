# Independent SHFW read investigation — 5 November 2026

## Scope and implemented work

Built an original, local read-only diagnostic instrument under `scripts/m365-inspection/`, served by `scripts/inspect-m365.mjs`. It reuses Velunivo's existing Web Bluetooth transport, Mi FE95 authentication, authenticated UART cipher, fragment parser and request matcher. No Utility implementation or third-party implementation was copied. Public protocol research supplied candidate read operations; arbitrary addresses and all configuration writes remain unavailable. See [tool design, operation, sources and limits](../M365_INSPECTION.md).

The user explicitly approved new pairing for this probe, including the possibility that Utility's saved Xiaomi pairing would need repair. The user then performed pairing and supplied two generated diagnostic JSON files. Their `provenance` field alone is not proof of authenticity; the instrument's code performs authenticated response validation, and its later live result was also observed through Computer Use.

## Hardware evidence from the original seven-block probe

Both user-supplied snapshots contain all seven requested blocks and no reported failures, battery 100%, speed 0 m/s, and raw firmware bytes `[85,81]` (`0x5155` little-endian). Those bytes are not promoted to a verified SHFW version: firmware spoofing was enabled in the preceding Utility inspection. Earlier Utility UI observations reported Pro 2 / SHFW 3.12.2. No new independent exact model/firmware identification was established here.

| File | Snapshot time (UTC, from file) | Active-profile response | SHA-256 |
| --- | --- | --- | --- |
| `velunivo-readonly-1793821929101.json` | 4 Nov, 19:51:38.002 | `[3,0]` | `2fd39a87f984ab20063138034d29cf4aa2ec9b697f4552802a825e577006d5e5` |
| `velunivo-readonly-1793821946316.json` | 4 Nov, 19:52:23.602 | `[1,0]` | `646f5d010a1a24c4e523318d0d049f6f0897505a6482e4770934b3af069b685b` |

Comparison found exactly one changed block byte: byte 0 of the SHFW `0xB2` response changed 3 → 1. All six 32-byte profile blocks were identical across those two files. This establishes observed response values and stability of those blocks, not which physical action caused the selection change. The read-only instrument has no profile-switch operation.

The user subsequently confirmed that the 3 → 1 → 3 response changes were caused by their manual profile switching, including switching from Profile 1 to Profile 3. This adds user-observed action correlation to the raw read evidence; it is not an independent software-write test.

The browser subsequently displayed another successful seven-block result at `2026-11-04T19:52:44.362Z`, with `0xB2` response `[3,0]` again and the same profile blocks. That displayed result was saved as `velunivo-readonly-1793834834617.json`. It corroborates a return to the original reported profile 3 without a write by this instrument. The files are sequential reads, not atomic full configurations or restorable backups. No full-profile copy/reset/restore operation was tested.

Private evidence copies are kept under `/Users/xarber/Documents/Codex/2026-11-05/velunivo-independent-inspection/`, with owner-only directory/file permissions. Original user-provided downloads were preserved. Raw blocks and authentication secrets are excluded from Git.

## Research findings and remaining uncertainty

The [primary public research report](https://github.com/zero2005x/M365-Rokid-HUD/blob/bfa2aaa40cec758d6e530f862fe42f623d6f6e00/doc/reverse-engineering/scootbatt-reports/04-write-commands.md) describes SHFW read command `0x31`, candidate profile bases 1/60/119, later blocks 17/76/135, and active selector `0xB2`. It is static research into another app, not hardware validation of current SHFW writes. Its light-field read/write discussion contains contradictory bit interpretations and uncertain address arithmetic. No proposed write from that report was executed.

The [generic Xiaomi protocol reference](https://github.com/etransport/ninebot-docs/wiki/protocol) describes word-based register addressing. Accounting for two bytes per word could explain some of the report's apparent byte/register offset discrepancies. This is an inference, not a verified current SHFW field layout. Do not resolve the conflicting light bits or timeout offsets by guessing.

The instrument was extended to ten candidate reads by adding raw 32-byte continuations at 178, 194 and 210. These are exploratory reads, not named settings. Initially this revision had software validation only and the device picker found no scooter. The follow-up below establishes physical response evidence for all ten reads.

Remaining steps:

1. Obtain a ten-block baseline with the original settings in place.
2. Use Utility to change one light field or timeout at a time, capture another independent snapshot, restore the field, and verify another independent snapshot plus Utility UI/physical light as appropriate.
3. Establish the field address, width, units and preserved neighboring bits from those controlled differences, together with version/model validation.
4. Only then implement narrowly allowlisted writes with acknowledgment/read-back and failure recovery; physically exercise the independent controls.

No timeout, headlight or profile write has been added to Velunivo. The prior 5/300-minute timeout restoration remains Utility read-back evidence; these new seven-block snapshots do not include independently identified timeout fields. Direct headlight-off behavior remains unresolved. No firmware, braking, current, speed-limit or riding-mode write was performed by this tool.

## Controlled light comparison — 5 November follow-up

The user powered the scooter on and completed physical pairing approval as needed. Computer Use operated the local probe and Utility. The probe authenticated through Velunivo's own code and successfully read all ten blocks on three occasions, each with zero failed blocks, reported battery 100% and speed 0 m/s. All three returned active-profile response `[3,0]`.

| State | Snapshot time (UTC) | Local evidence name | SHA-256 |
| --- | --- | --- | --- |
| Original baseline | `2026-11-05T05:08:33.964Z` | `baseline-10-blocks.json` | `cf9053143c327c923e15edc41659e1339533b63a68462202f4d134ae627ec4c5` |
| Profile 1 Always on headlight enabled in Utility | `2026-11-05T05:13:33.790Z` | `profile1-headlight-on.json` | `6f19afd6dd16192fa5deedf81d77632097c1eb805a74fc6651b99bf26c0b7a16` |
| Profile 1 restored to Off in Utility | `2026-11-05T05:18:24.276Z` | `restored-10-blocks.json` | `e478cab3097a119733b42dc1a41a68f70749a0385454bb2be0da3463818cb376` |

Utility again reported Mi Electric Scooter Pro 2 / SHFW 3.12.2. It initially displayed Profile 1 Always on headlight Off. The active profile was left at 3 throughout. Only the inactive Profile 1 flag was enabled, avoiding a deliberate always-on override in the running profile. Utility was disconnected before each independent read and loaded configuration again after reconnect before restoration.

The enabled snapshot differs from the baseline in **exactly one captured block byte**: `profile1Later` (SHFW read `0x31`, register 17, 32 bytes), byte offset 10 changes `0x62 → 0x66`. Byte offset 11 remains `0x03`; interpreted as a little-endian word this is `0x0362 → 0x0366`, XOR `0x0004`. All other captured bytes, including the other profiles and global blocks, are unchanged. After Utility restored the switch to Off, **every byte in all ten captured blocks exactly matched the baseline**.

This establishes a measured correlation between Profile 1's Always on headlight setting and mask `0x0004` in that returned word on the observed combination. It does not establish a direct front-light on/off command, other profiles' bit layout, a whole-configuration backup, or an independently tested write. Word addressing would suggest register 22 for this word (`17 + 10/2`), consistent with the public research candidate; that arithmetic is still an inference until direct register read and independent write/read-back are tested. No write address is derived from UI order.

The two additional continuation blocks starting at 194 and 210 were all zero in these snapshots. The 178 block contained profile-trigger values followed by zeros. None of these observations identify normal or locked timeout fields. Zero responses must not be interpreted as zero-minute timeouts or proof that a setting is disabled.

After restoring Profile 1, Utility freshly displayed **5 minutes normal / 300 minutes locked**. Neither timeout was changed in this follow-up. The user confirmed the physical front headlight was **off** before the final independent read. Both clients were disconnected at the end. No throttle, brake, motor, current, riding-mode, active-profile, boot-trigger, firmware, serial or region write was deliberately performed.

Original passive Web Bluetooth observers recorded the encrypted enable transaction (12 GATT chunks: 3 writes and 9 notifications) and restoration writes (3 transmitted chunks). They were installed after registration, saved outside Git, and removed. The restoration observer captured transmit chunks only. These are encrypted chunks, not plaintext field definitions or acknowledged command counts:

- `velunivo-profile1-light-enable-2026-11-05.json`: SHA-256 `fd414209ea9a158f481104cd94735cfd81c1bef516a54204a4bf5ca32bb53e38`.
- `velunivo-profile1-light-restore-2026-11-05.json`: SHA-256 `e0f858981a7886c889d027fc1882b6819c9f0d3d0433cafebe4df607d8856435`.

All evidence above is under the same private local evidence directory, not Git. PNG download attempts did not produce retained screenshot files; do not cite them as saved evidence. The JSON snapshots and traces were checked on disk and their checksums verified.

The shared authenticator's error text promised automatic reconnection, but this research tool only retries after the user selects Connect scooter again. The tool now substitutes accurate physical-approval guidance without changing production authentication or adding automatic pairing. Lint, typecheck and diff whitespace checks passed for this guidance/documentation change. No extra functional tests were added for the text-only behavior. The previously recorded 25-test run belongs to the initial tool implementation.

## Validation and release scope

Six new synthetic tests cover immutable read allowlists, strict namespace/length matching, authenticated fragmented responses, movement rejection, cancellation before/during reads and exclusion of secret fields. All **25 targeted tests passed**, including the existing Mi authentication, request and browser-transport suites. `npm run lint`, `npm run typecheck` and `git diff --check` passed. The local browser page was rendered and exercised through Computer Use. HTTP smoke checks confirmed root and bundle 200, unknown path 404, POST 403, unexpected Host 403, restrictive CSP and `no-store`. These checks establish software behavior, not successful scooter writes or native app behavior.

No native app code, application version, dependency version, release channel or hosted production deployment changed. This is a development diagnostic tool and documentation batch, not a new application release. No native build, simulator, mobile installation or deployment is claimed. The separate browser tool needs Chrome/Edge Web Bluetooth; native and mobile-browser validation remain unavailable.
