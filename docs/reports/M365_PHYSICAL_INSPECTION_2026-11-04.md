# Physical scooter inspection — 4 November 2026

## Scope and observations

Chrome ScooterHacking Utility 4.2.1 release #78 was connected to a physical Mi Electric Scooter Pro 2 reporting SHFW 3.12.2. The user confirmed live dashboard updates. No simulator or Velunivo native test was performed.

Read the three profile editors and global sections through Utility's accessibility tree. Saved 35 local reference snapshots outside the repository, with an explicit non-restorable manifest and checksums. These contain displayed values, not a complete binary configuration or independently verified field layout. Do not import them into a scooter or label them a restorable backup.

Original ordinary shutdown delay: 5 minutes. Locked shutdown delay: 300 minutes. Ordinary delay was temporarily changed to 6 through Utility and returned to 5. Reopened the editor, then disconnected and reconnected Utility, loaded configuration again, and observed 5/300. This is verification through Utility after reconnect, not independent Velunivo protocol read-back or a timed physical shutdown test. Other system, profile, motor, braking, current and firmware settings were not deliberately changed. No headlight write was tested.

## Capture findings

Chrome Apple Events scripts initially ran in an isolated world; patching its Bluetooth prototypes did not observe the application's calls. Installing page-world observers captured 697 transmitted packets and 536 replies during the live dashboard session and reconnect. The NUS protocol used encrypted `55 AB` packets. The configuration metadata endpoint `https://apps-data.cfw.sh/shfw/v8/config` returned an 18,744-byte encrypted JSON envelope with `d` and `n` fields. These observations do not establish plaintext field addresses, scales, supported ranges, integrity checks or transaction semantics. Pairing credentials were not exported. Raw captures and proprietary application code were not committed.

Capture was stopped afterward; Utility remained connected. Diagnostic wrappers are ephemeral to that page and disappear on reload. No application code or production configuration was changed by this investigation.

## Independent implementation and remaining work

Velunivo must implement protocol behavior independently with readable names, typed field definitions, validation, version/model checks and tests. Rewording or lightly modifying Utility code is not an independent implementation. No Utility source was copied into Velunivo.

Headlight/timeouts/profile editing and restorable profile backup remain unavailable until verified protocol definitions or reliable plaintext command/response observations establish their behavior. A safe restore needs complete reads, explicit units/ranges, matching firmware/model, validation before writing, per-field acknowledgment/read-back and failure handling. Do not infer write addresses from UI order or replay encrypted session packets.

Utility profile actions exposed rename/copy/reset; global actions exposed reset. No complete backup export was found in those inspected menus; this does not establish that no other export exists.

## Scooter images

Observed model/asset requests through `https://apps-data.cfw.sh/utility/web/model` and `/utility/web/asset`. No reusable asset licence or attribution terms were established. No images were copied, hotlinked or bundled. Model-specific suggestions should use an explicitly reusable asset source or user-provided images; public availability alone is insufficient.

## Follow-up physical session — 4 November 2026

Continued with Computer Use on the same Utility 4.2.1 / SHFW 3.12.2 / Pro 2 combination. Registration initially failed; the user completed the physical button/reconnection steps. Utility later showed a connected scooter. The user reported that their manual clicks worked where automated submission appeared not to; some automated clicks returned the previous accessibility tree before the subsequent observation updated. Accordingly, editor values alone were not treated as persistence evidence: configuration was loaded again after an explicit disconnect and user-assisted reconnect.

### Reversible checks and restoration

| Item | Original | Temporary test | Restoration evidence |
| --- | --- | --- | --- |
| Normal shutdown delay | 5 minutes | 6 minutes | Returned to 5; 5 displayed after reconnect and fresh configuration load |
| Locked shutdown delay | 300 minutes | 290 minutes | Returned to 300; 300 displayed after reconnect and fresh configuration load |
| Profile 3 Always on headlight | Off | On | Returned to Off; Off displayed after reconnect |
| Front headlight physical state | Off, user confirmed | User confirmed it turned on after enabling Profile 3's setting | Disabling the setting left the light on; user pressed the power button once and confirmed it was off |

The normal-delay editor advertised 0–30 minutes, step 1, with 0 = Off. The locked-delay editor advertised 0–300 minutes, step 10, with 0 = Off. These are Utility-displayed constraints for this session, not independently verified wire units, supported firmware ranges, or timing measurements. No timed shutdown test was performed.

All three profile light editors displayed Always on headlight Off before testing. Only Profile 3's setting was written. After reconnect, each profile was opened again and displayed Off. Profile 1 and Profile 2 settings were not deliberately changed. The global Active profile and Profile at boot labels both read Profile 3 before and after reconnect; no active-profile or boot-trigger change was performed. Selecting a profile editor is not evidence of changing the running profile. The editor selection was returned to Profile 1 at the end.

**Observed headlight semantics:** enabling Always on headlight in Profile 3 caused the physical front headlight to illuminate, according to the user's direct observation. Disabling that setting did not extinguish it. Do not implement this field as a symmetrical immediate headlight on/off command. Its behavior across other profiles, button presses while enabled, reboot, and other firmware versions remains untested. Physical restoration to Off was confirmed before the final reconnect; no new physical-light confirmation after that reconnect was obtained.

No throttle, motor, brake, current, speed limit, trigger, firmware, serial, region or lock setting was deliberately modified. Profile copying/reset/import and a complete restorable backup remain untested.

### Capture evidence and independent implementation boundary

An original passive page-world observer wrapped the standard Web Bluetooth write methods, copied transmitted bytes, and attached notification listeners to characteristics discovered in the same service. Original methods and listeners were restored afterward. The observer neither generated scooter commands nor inspected/copied Utility implementation code. Capture began after registration and stopped before disconnect/reconnect, excluding authentication traffic. It was not an application or firmware modification.

The saved capture contains **151 GATT events: 35 writes and 116 notifications**, including 4 empty notifications. Events are BLE chunks, **not 151 complete commands or acknowledged transactions**. Stage labels are operator annotations; late replies and unrelated traffic can fall into the next stage. In particular, the locked-timeout restoration stage contains additional traffic, so event counts cannot establish a one-to-one command mapping.

| Capture stage | Writes | Notifications |
| --- | ---: | ---: |
| Baseline | 5 | 8 |
| Normal timeout 5 → 6 | 3 | 11 |
| Normal timeout restored to 5 | 3 | 11 |
| Locked timeout 300 → 290 | 3 | 11 |
| Locked timeout restored to 300 | 9 | 33 |
| Profile inspection | 4 | 16 |
| Profile 3 Always on headlight enabled | 3 | 9 |
| Profile 3 Always on headlight disabled | 3 | 9 |
| Physical light restoration stage | 2 | 8 |

The session used encrypted `55 AB` traffic. No plaintext SHFW register addresses, scales, payload layout, acknowledgment semantics, or atomic configuration-write rules were established. Existing Velunivo `m365Packets.ts`, `XiaomiM365Plugin.ts` and the encryption implementation were inspected only for the existing protocol path; no keys were extracted and no ciphertext was replayed. No new scooter-write capability was implemented. Independent protocol work remains blocked on verified definitions or authenticated plaintext observations from an independently controlled client.

Private local evidence (outside Git):

- `/Users/xarber/Documents/Codex/2026-11-04/velunivo-physical-testing/velunivo-physical-capture-2026-11-04.json` — 36,114 bytes; SHA-256 `c8f38a0c8b3148c22930be58b5540805b1d20700623b4adb7e10ad4a7ee6c124`; first/last events `2026-11-04T19:35:51.538Z` / `2026-11-04T19:38:18.087Z`. This is a diagnostic capture, not a restorable backup.
- `/Users/xarber/Documents/Codex/2026-11-04/velunivo-physical-testing/velunivo-restored-timeouts-2026-11-04.png` — Utility screenshot of 5/300 after reconnect.

Evidence directory permissions are owner-only; raw packets are not committed. Utility remained connected at the end, and temporary capture instrumentation was removed. No Velunivo native or web runtime, simulator, physical installation, build, release, or production deployment was tested or changed in this follow-up. Repository verification results are recorded below.

Repository checks for this documentation-only follow-up: `npm run lint`, `npm run typecheck`, and `git diff --check` passed. The saved restoration screenshot was visually inspected and shows both 5 and 300 minutes. No automated functional tests were run because application code was unchanged. These checks do not validate scooter behavior or Velunivo's native controls.
