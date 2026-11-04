# Independent M365 inspection tool

This local developer instrument uses existing Velunivo code to authenticate a Xiaomi FE95 session and read raw candidate SHFW blocks. It is separate from the installed application, excluded from its routes and release bundles, and does not enable any new production capability. It is not a restorable backup tool or an installable web product.

## Run and use

Run `node scripts/inspect-m365.mjs` from the repository, then open `http://127.0.0.1:9347/` in Chrome/Edge with Web Bluetooth. The server uses the installed esbuild 0.28.2; it installs no dependencies, compiles in memory and binds only to loopback. Stop it with Ctrl-C. The browser requires a real user action and its own device chooser. Safari, Firefox and iOS Simulator are not supported by this instrument.

Keep the physical scooter stationary and disconnect Utility and other scooter clients. Acknowledge the pairing notice before connecting. A new Xiaomi registration can replace another app's pairing; that app may require pairing again. Authentication uses the existing `authenticateMi` implementation, not Utility code. The browser may ask for a physical headlight-button approval. No credential, token, key or serial is included in the saved diagnostic snapshot. Tokens remain in the tab's memory, survive a Disconnect/Reconnect within that tab, and are lost on reload/close. The scooter's registration itself is persistent and is not undone when the tab closes.

Read inspection verifies authenticated controller telemetry (`0x01`, `0xB4`, 16 bytes), requires speed 0–0.15 m/s and battery 0–100%, reads raw firmware bytes (`0x01`, `0x1A`, 2 bytes), then sends each candidate configuration read once. Individual configuration timeouts are recorded by block name; cancellation/disconnection stops subsequent requests. All request matching includes sender, command namespace, register and exact length. Authentication checks and replay rejection are supplied by the existing `MiUART`; fragments are handled by the existing `PacketStream` and requests by `VehicleRequestChannel`.

Save diagnostic snapshot downloads only the last completed result to the user's browser. Snapshot bytes may contain private configuration. Keep them outside Git. The server receives no snapshots, has no upload endpoint, permits only GET requests with its exact loopback Host header, and serves only two fixed paths. CSP prohibits external network connections, forms and embedding; responses are not cached. The only device traffic before a read is selected is authentication. No configuration-write, firmware-write, profile-switch, lock or arbitrary-register control is exposed.

## Candidate reads and evidence

`scripts/m365-inspection/protocol.ts` contains the immutable allowlist. There is no caller-supplied address/length API. Requests use Xiaomi body `20 31 <register> <length-low> 00` inside the existing authenticated `55 AB` transport. Replies must have `23 31 <register>` and exactly the requested data length. `0x31` SHFW reads are distinct from ordinary `0x01` register reads; `0xB2` in one namespace must not be decoded using the other's semantics.

| Block | Register | Bytes | Status |
| --- | ---: | ---: | --- |
| activeProfile | 178 / `0xB2` | 2 | Published candidate; physical responses observed, see report |
| profile1Start / profile1Later | 1 / 17 | 32 each | Published candidates; physical responses observed |
| profile2Start / profile2Later | 60 / 76 | 32 each | Published candidates; physical responses observed |
| profile3Start / profile3Later | 119 / 135 | 32 each | Published candidates; physical responses observed |
| globalStart / globalLater / globalEnd | 178 / 194 / 210 | 32 each | Exploratory continuation reads; no setting decoder or write mapping established |

The original seven-read build was exercised by the user on a physical scooter. Later exploratory global reads require their own hardware evidence; success of the original seven must not be extrapolated to them. Snapshot `provenance` is set by this instrument and is not a cryptographic signature on an imported JSON file. Firmware bytes can be spoofed by SHFW; they are not sufficient version/model gating. A complete raw block is not proof of a field's meaning or restorability.

The current ten-block tool stamps `probeRevision: readonly-shfw-2`; the original seven-block snapshots have no revision field. Reads are sequential with per-block timestamps, not an atomic configuration snapshot. Exported `capturedAt` marks the start of the block series.

Protocol research references (facts only; no third-party implementation was copied):

- [Primary Scootbatt research report, revision bfa2aaa](https://github.com/zero2005x/M365-Rokid-HUD/blob/bfa2aaa40cec758d6e530f862fe42f623d6f6e00/doc/reverse-engineering/scootbatt-reports/04-write-commands.md): candidate SHFW read namespace, addresses and sizes. This report is static analysis of another app, not physical validation. It contains conflicting light-bit interpretations and discusses addressing uncertainty. Its proposed write addresses are not an authorization or sufficient basis to write a scooter.
- [Xiaomi framing and register addressing](https://github.com/etransport/ninebot-docs/wiki/protocol): generic request/reply envelopes and word-based register offsets. Applying the generic word-offset rule to SHFW is an inference until independently checked. Do not confuse a byte offset within a returned block with a register address.
- [Official legacy SHFW feature guide](https://github.com/scooterhacking/wiki/blob/main/pages/shfw020guide.txt): describes available features; does not establish a current wire layout.
- [Web Bluetooth documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) and [esbuild API](https://esbuild.github.io/api/): developer-tool browser and bundle constraints.

## Validation

`tests/m365-inspection.test.ts` tests read allowlisting, immutable descriptors, strict reply matching, ordinary-vs-SHFW `0xB2` separation, authenticated fragmented synthetic responses, no secret fields in exports, movement rejection and cancellation before/during reads. Late connection/authentication results cannot replace a newer session, and cancelled reads cannot publish over a newer result. These are software safeguards, not evidence of native or physical write behavior. The [physical inspection report](reports/M365_PHYSICAL_INSPECTION_2026-11-04.md) separates actual observed hardware evidence from them.

Before adding a production write: establish the exact field on this model/firmware using controlled differences and restored snapshots, preserve neighboring bits, check acknowledgments and actual read-back, handle interrupted operations and reconnect, then test the independent implementation on the physical scooter. No report or source snippet from another app replaces those checks.
