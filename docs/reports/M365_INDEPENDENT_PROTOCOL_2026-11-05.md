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

The browser subsequently displayed another successful seven-block result at `2026-11-04T19:52:44.362Z`, with `0xB2` response `[3,0]` again and the same profile blocks. That displayed result was saved as `velunivo-readonly-1793834834617.json`. It corroborates a return to the original reported profile 3 without a write by this instrument. The files are sequential reads, not atomic full configurations or restorable backups. No full-profile copy/reset/restore operation was tested.

Private evidence copies are kept under `/Users/xarber/Documents/Codex/2026-11-05/velunivo-independent-inspection/`, with owner-only directory/file permissions. Original user-provided downloads were preserved. Raw blocks and authentication secrets are excluded from Git.

## Research findings and remaining uncertainty

The [primary public research report](https://github.com/zero2005x/M365-Rokid-HUD/blob/bfa2aaa40cec758d6e530f862fe42f623d6f6e00/doc/reverse-engineering/scootbatt-reports/04-write-commands.md) describes SHFW read command `0x31`, candidate profile bases 1/60/119, later blocks 17/76/135, and active selector `0xB2`. It is static research into another app, not hardware validation of current SHFW writes. Its light-field read/write discussion contains contradictory bit interpretations and uncertain address arithmetic. No proposed write from that report was executed.

The [generic Xiaomi protocol reference](https://github.com/etransport/ninebot-docs/wiki/protocol) describes word-based register addressing. Accounting for two bytes per word could explain some of the report's apparent byte/register offset discrepancies. This is an inference, not a verified current SHFW field layout. Do not resolve the conflicting light bits or timeout offsets by guessing.

The instrument was extended to ten candidate reads by adding raw 32-byte continuations at 178, 194 and 210. These are exploratory reads, not named settings. This ten-block revision has software validation but **no physical response evidence yet**. An attempted new connection reached Chrome's picker with no compatible device listed. Further physical work requires the scooter to be available and selected again.

Remaining steps:

1. Obtain a ten-block baseline with the original settings in place.
2. Use Utility to change one light field or timeout at a time, capture another independent snapshot, restore the field, and verify another independent snapshot plus Utility UI/physical light as appropriate.
3. Establish the field address, width, units and preserved neighboring bits from those controlled differences, together with version/model validation.
4. Only then implement narrowly allowlisted writes with acknowledgment/read-back and failure recovery; physically exercise the independent controls.

No timeout, headlight or profile write has been added to Velunivo. The prior 5/300-minute timeout restoration remains Utility read-back evidence; these new seven-block snapshots do not include independently identified timeout fields. Direct headlight-off behavior remains unresolved. No firmware, braking, current, speed-limit or riding-mode write was performed by this tool.

## Validation and release scope

Six new synthetic tests cover immutable read allowlists, strict namespace/length matching, authenticated fragmented responses, movement rejection, cancellation before/during reads and exclusion of secret fields. All **25 targeted tests passed**, including the existing Mi authentication, request and browser-transport suites. `npm run lint`, `npm run typecheck` and `git diff --check` passed. The local browser page was rendered and exercised through Computer Use. HTTP smoke checks confirmed root and bundle 200, unknown path 404, POST 403, unexpected Host 403, restrictive CSP and `no-store`. These checks establish software behavior, not successful scooter writes or native app behavior.

No native app code, application version, dependency version, release channel or hosted production deployment changed. This is a development diagnostic tool and documentation batch, not a new application release. No native build, simulator, mobile installation or deployment is claimed. The separate browser tool needs Chrome/Edge Web Bluetooth; native and mobile-browser validation remain unavailable.
