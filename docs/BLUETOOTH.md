# Bluetooth vehicle bridge (0.1.23)

## What is implemented and what is verified

Velunivo has one vehicle-independent, read-only BLE bridge. Vehicles → select vehicle → Add Bluetooth Pairing explains data use before Continue requests permissions. Discovery lists positive compatible advertisements only; connection verifies an identity and a telemetry response before saving a private app association. This is not a claim of operating-system Bluetooth bonding. Disconnect, reconnect, replace and forget are supported.

The initial production plugin implements legacy Xiaomi M365-family UART reads and the first-generation encrypted 5AA5 handshake used by compatible Pro 2 Bluetooth firmware. SHFW on the motor controller alone does **not** determine Bluetooth compatibility. Pro 2 BLE129 / compatible BLE132 are protocol targets, not hardware-certified combinations. FE95/Mi token authentication and 5AAB-only devices are explicitly unsupported. Do not change firmware to use this app. Authentication may ask for a power-button press; Velunivo never writes vehicle configuration, firmware, modes or limits.

**No physical scooter or e-bike communication was verified during this implementation.** Tests validate byte fixtures, encrypted authentication with an independent Node/OpenSSL fixture peer, state transitions, simulator behaviour and persistence. A fresh native GitHub build is needed for BLE; an older binary cannot gain the native module from JavaScript alone. Expo Go, browsers and the iOS Simulator do not provide this production BLE transport. Web retains navigation/recording and can run the clearly labelled developer telemetry simulator. No genuine e-bike protocol is registered yet.

## Architecture and plugin contract

`src/bluetooth/types.ts` is the frontend contract. `service.ts` registers immutable plugins at build time; `registry.ts` filters by vehicle type and excludes simulator plugins from production discovery. No screen knows Xiaomi register addresses. The existing `escooter` / `ebike` profile kinds map to `electric_scooter` / `electric_bike`; the bridge also supports future bicycle/other protocols.

- `transport.ts`: lazy native BLE manager, advertisement decoding, permissions, bounded connection, notifications and 20-byte UART writes. `transport.web.ts` has no native imports and returns a clear unsupported message.
- `bridge.ts`: authoritative state, verified associations, shared connection, consumer leases, scan duration, retry backoff and partial telemetry publication.
- `telemetry.ts`: declared-field validation, SI units, per-field timestamps/source and freshness. Speed expires after 3 seconds, signal after 15 seconds, other readings after 30 seconds. A 2-second render-clock tolerance prevents fresh packets from flickering unavailable between UI ticks. Invalid units/ranges, undeclared fields and older timestamps cannot overwrite good readings.
- `persistence.ts`: SecureStore association index and per-vehicle records; ephemeral authentication challenges are never persisted. Web never saves fake hardware associations. `preferences.ts` uses a separate versioned AsyncStorage key and does not replace existing app preferences.
- `react.tsx`: provider plus lightweight ride lease and telemetry subscriptions. Navigation and explicit recording consume the same singleton. Last ride consumer disconnects; manual disconnect stops retries. The retry delay grows from 1 second to 30 seconds. Foreground resume checks the existing target.
- `tripTelemetry.ts`: timestamped timeline samples and versioned summaries, independent of UI visibility.

A plugin declares `id`, manufacturer, supported vehicle types/models, advertised services, capabilities, authentication and compatibility limitations. `detect(device)` must return positive compatibility only with corroborating advertisement evidence. An uncertain match is excluded. `open(link, context)` verifies the protocol and returns an immutable identity/capability session and an idempotent `close()`. `context.emit({fields, extensions})` publishes partial readings. `context.signal` cancels in-flight initialization when a connection is abandoned; plugins must clean up pending requests and subscriptions on abort. `context.phase()` supplies ordinary user-facing status; `context.random()` supplies cryptographically random bytes. Plugins never own application navigation or storage.

Readings contain `{value, timestamp, source, unit}`. Sources are `vehicle`, `calculated`, `gps`, or `simulator`; internal speed is m/s, distance/range m, voltage V, current A, power W, temperature °C, battery %, RSSI dBm. All fields are optional. Unsupported values stay absent. Manufacturer extension fields may retain ambiguous raw readings for diagnostics; do not promote them into a component-specific UI field without validated semantics. Add new plugins to `service.ts`, declare genuine capabilities, add detection/packet/error fixtures and a physical validation matrix. Do not register placeholders for future Ninebot or e-bike protocols.

## Initial Xiaomi wire contract

Positive discovery currently requires all three: Nordic UART service `6e400001-b5a3-f393-e0a9-e50e24dcca9e`, a `MIScooter…` local/device name, and manufacturer bytes starting `4e 42 20` (the documented NB/20 signature). A name alone or generic UART device is insufficient. This conservative advertisement contract may exclude otherwise compatible firmware; extend it only with validated advertisements and negative fixtures. Model labels remain “Xiaomi M365 family” until identity verification; no guessed exact Pro 2 model.

The write characteristic is UART `…0002…`, notifications `…0003…`. Plain packets are 55AA with a checked complemented additive checksum; the parser handles fragments/coalesced notifications. Only allowlisted read command `01` is sent, apart from required 5B/5C/5D encrypted session authentication messages. Reads are serial `10` (14 bytes), firmware `1A` (2 bytes, optional), ESC `B4` (16 bytes), ESC `B9` (2 bytes) and BMS `31` (10 bytes). Polling is sequential with a 350 ms minimum delay, not concurrent requests. Optional failed registers are disabled for that session; repeated primary-read failure disconnects for the bridge to reconnect.

ESC B4 provides battery %, speed in metres/hour (converted to m/s), and odometer metres. B9 provides trip metres. BMS31 provides percentage, signed current in centiamps, voltage in centivolts and legacy battery-temperature bytes offset by 20 °C. Calculated electrical power is labelled calculated and retains its sign; it is not an energy-consumption measurement. The frame-temperature register is retained only as an extension because references disagree about which component it represents. A negative current can represent regenerative braking; this plugin does **not** assert charging from current, and does not expose charging, mode, cycles, remaining range or controller/motor temperature as verified capabilities. Firmware variants and scaling need hardware confirmation.

`legacyCrypto.ts` independently implements the documented first-generation AES/SHA-1 wire format and key transitions with MIT-licensed noble primitives, authenticated checksums and replay rejection. The power-button approval challenge is ephemeral, reuses the same random app nonce during bounded retries and never changes scooter settings. Unsupported modern authentication fails visibly and leaves GPS navigation operational.

## Navigation, recording and settings

Real, connected speed replaces GPS speed only while fresh and visible; mapped road limit and configured riding/hardware limits remain separate. GPS remains the fallback after stale data/disconnection. `VehicleBatteryBadge` appears directly below the road-limit circle only for fresh actual battery readings. It uses normal colour at 40–100%, orange at 20–39%, red below 20%, accurate fill and a numeric percentage. It never substitutes 0 for missing data. A lightning icon requires a plugin's explicit, fresh charging field; the initial Xiaomi plugin cannot show one.

Settings → Bluetooth separates persistent per-capability display switches from **Collect trip telemetry**. Hiding a metric does not stop analytics collection. Disabling collection stops new BLE samples entering ride archives while GPS continues. Developer Mode exposes the simulator, labels every simulated reading, bypasses physical transport/permissions, and never saves an association or simulated battery/speed into real ride analytics.

BLE samples are attached at the existing GPS recording cadence, not every Bluetooth packet, and stored in existing 100-sample chunks. Each carries vehicle/plugin identity, connection state, readings and timestamps. The optional summary records start/end battery and interruptions. Existing records with no BLE data continue to load unchanged; additive optional fields require no destructive migration. New BLE preferences/associations and summary data each declare schema 1; unsupported association plugins/schemas are ignored, preferences fall back to defaults.

Automatic battery usage is saved only with a fresh connected real vehicle, an early start reading (first 15 seconds), an end reading within 30 seconds, at least 10 seconds between readings, no charging/battery increase, and no connection or battery-reading gap. It supplies the existing battery feedback system and learned range analytics without a second prompt. Otherwise the existing persistent **Ask for battery usage** preference decides whether the saved trip receives the existing skip-capable prompt. Missing/uncertain telemetry never blocks GPS recording. Charging or interrupted measurements do not become misleading subtraction-based battery usage. JSON includes the optional timeline/summary; GPX remains a location track, not a BLE archive.

## Native setup and background limits

Dependencies: `@sfourdrinier/react-native-ble-plx` 3.9.3 (maintained plx fork supporting RN0.86/Expo57), `expo-crypto` 57, `@noble/ciphers` 2.4 and `@noble/hashes` 2.4. BLE fork documentation: https://github.com/sfourdrinier/react-native-ble-plx . No firmware-modification dependency is included.

The existing Expo config plugin adds iOS Bluetooth permission text and central background mode, plus Android scan/connect/location permissions and its connected-device foreground service. Existing location background modes remain in place. iOS requires a development/release native build, Bluetooth permission, and compatible nearby hardware. Android 12+ requests Scan/Connect when Continue is pressed; older Android uses location permission for discovery. Android's scan is not marked neverForLocation because that can filter vehicle advertisements. The current Android session uses the library's foreground service while connected.

Background connectivity is best effort. iOS may defer notifications, throttle, suspend or terminate work; this implementation does not promise JS polling after app termination and does not claim CoreBluetooth restoration support. Returning to the foreground can reconnect an active consumer. Navigation/recording never depend on BLE availability. Simulator/background/permission behaviours still need native target testing.

Use the existing GitHub `release.yml` workflow for native builds; no local native compile, prebuild, Pods or SDK download was performed for this feature. Bluetooth permission metadata is extracted by the existing release/AltSource pipeline from the built application.

## References and licensing

All four requested repositories were inspected, rather than inferred from their names. These are protocol references; no source from them is vendored:

| Reference | Inspected revision | Findings / license |
| --- | --- | --- |
| [CamiAlfa/M365-BLE-PROTOCOL](https://github.com/CamiAlfa/M365-BLE-PROTOCOL) | `ade00c311a29bd70342a5f8325c59e67f8457e73` | Original firmware1.3.4 UART advertisements, framing/register documentation; LGPL2.1+. Credit CamiAlfa and contributors. |
| [zero2005x/ninebot-ble](https://github.com/zero2005x/ninebot-ble) | `bb0fa013cc6ddec08f2d90bd4de9932465e83579` | Modern Mi token/crypto and register interpretation; README/Cargo declare MIT but referenced license file is absent. No implementation copied. |
| [jx-grxf/scooter-tuning-db](https://github.com/jx-grxf/scooter-tuning-db) | `1141bbfa0761fd915ff0d22f8ccb52172de1bbb7` | Protocol-family/register facts. CC BY4.0, Johannes Grof and contributors; attribution here, adapted factual mappings in SI decoding. |
| [scooterhacking/NinebotCrypto](https://github.com/scooterhacking/NinebotCrypto) | `9ba0c551488a8433cea173d1bed843240f63ec30` | First-generation 5AA5 handshake and documented compatibility; AGPL3. No library linked, ported source or vendored implementation; independent wire implementation. |

Do not transplant upstream code into a plugin without reviewing its license, including distribution/source obligations. Protocol support is not permission to copy an implementation with missing or incompatible licensing.

## Validation checklist

Automated tests cover registry filtering and scooter/e-bike separation, corroborated/uncertain advertisements, partial normalization and freshness, battery thresholds, known plaintext frames, unsupported reads, independent encrypted authentication fixtures, identity verification, leases/reconnect/manual-disconnect, permission and service errors, simulator isolation, battery gaps/charging, prompt deduplication and settings restoration. Existing navigation, recording and release tests also run.

Before calling a physical model supported, record its BLE/ESC/BMS/SHFW versions and anonymised advertisement signature; test identity, speed against GPS, battery against the dashboard, signed current/temperature/voltage, power-button auth, unsupported registers, out-of-range recovery, Bluetooth off/on, background/foreground, trip save and manual-prompt fallback on both native platforms. Do not upload personal device IDs, serials or ride locations to the public repository.

## 0.1.24 — global preferences and public sharing vehicles

Public Sharing E-Scooter profiles never expose pairing or simulations. The bridge rejects their associations, removes old unsupported associations on initialization and reconciles orphaned pairings with the restored garage. Deleting an eligible personal vehicle first removes its association; a persistence failure leaves the vehicle available and does not silently remove the saved link. Protected/last vehicles do not lose their link from a rejected delete.

Settings → Bluetooth is entirely global: automatic reconnection, telemetry collection and per-metric visibility do not depend on the selected vehicle and show no pairing/device/vehicle menu. Pairing management remains under a personal Vehicle. Global visibility capabilities are the installed plugin union. Developer Mode exposes a persistent global telemetry simulation switch. It follows the chosen personal vehicle, shares the navigation/recording connection lease, shows a clearly labelled Demo battery below the speed limit and a telemetry panel in expanded controls in both modes. Hardware Bluetooth adapter changes do not disable the fake session.

Simulated samples may now be retained in GPS ride timelines/exports, explicitly marked simulated. They never supply automatic battery usage or real range calibration. Existing records remain compatible through optional flags; route simulation remains excluded from ride recording. Actual valid battery readings still integrate into the existing manual-prompt suppression path. Production Xiaomi capabilities and physical verification limits above remain unchanged.
