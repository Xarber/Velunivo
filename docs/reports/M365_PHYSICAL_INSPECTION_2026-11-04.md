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
