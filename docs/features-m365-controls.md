# M365 ride controls and physical validation

Lock/unlock is implemented through the existing Xiaomi M365 plugin and its acknowledged read-back path. Home, navigation and recording expose the shared connected-vehicle control. Both automatic options default off and are stored locally per vehicle (`m365-ride-controls-v1:<vehicle ID>`); they are removed by Clear all data and are not transferred in backups or peer sync.

Automatic unlock may reconnect a saved M365 association, but never initiates pairing. Automatic lock never queues a command for a later reconnection. Both require a real vehicle speed measurement no older than three seconds, at most 0.15 m/s, and an available lock capability. Simulation cannot trigger a scooter operation. A superseded start is cancelled; an ending activity must not lock a scooter while another activity is active. Failed/skipped actions show a notice. Always check the actual lock before leaving a scooter.

The top invalid-pairing action now invokes the same repair service as the existing connection-page action. The connection page hides the duplicate. Resuming the app first probes the existing connection rather than disconnecting solely because JavaScript telemetry timestamps are old. Polling tolerates five failed controller reads and at least twenty seconds without a response before replacing the connection.

## Ride detection prompt

When foreground ride detection uses alerts, iOS can show a separate two-minute riding prompt Live Activity with Start recording and Find destination actions. Existing navigation, recording and sharing layouts are unchanged. Stale prompt actions are hidden. Background detection uses an actionable local notification when a new Live Activity cannot be started; neither iOS background launch nor force-quit recovery is guaranteed. Android uses the notification fallback. Starting a ride dismisses the prompt. Native rendering and action delivery still require physical-device validation.

## Unsupported writes — deliberately disabled

Headlight, night-light scheduling, sleep timeout and locked timeout are not implemented. Public feature descriptions do not establish firmware-specific command/register layout, units or safe ranges. The known tail-light register is not evidence for a headlight command. The controls page explains unavailability instead of exposing nonfunctional switches. Do not guess writes or change firmware.

The [4 November physical inspection and follow-up](reports/M365_PHYSICAL_INSPECTION_2026-11-04.md) exercised Utility's normal and locked timeout edits and Profile 3's Always on headlight setting. Original values were restored and configuration was loaded again after reconnect. The user confirmed that enabling Always on headlight illuminated the front light; disabling that setting left the light on until a physical button press. This is not a verified symmetrical headlight command. Captured encrypted BLE traffic does not establish plaintext SHFW field mappings, so these writes remain unavailable in Velunivo. The three profile light editors were inspected; copying, resetting, full-profile writes and restorable backup were not tested.

The [5 November controlled mapping report](reports/M365_READ_MAPPING_2026-11-05.md) identifies read correlations for all three always-on headlight flags (mask `0x0004`, word locations 22/81/140), active profile (178), normal shutdown (247) and locked shutdown (248), with little-endian words and observed timer values in minutes. Final independent reads match the original baseline in all 26 captured blocks. These are observed read locations on the reported Pro 2 / SHFW 3.12.2 combination; exact independent write framing, acknowledgment/read-back, firmware gating, timer expiry and direct headlight-off remain unverified. Production controls stay unavailable pending those checks.

## Tonight's ScooterHacking Utility test

Use the physical stationary scooter with the rider nearby. Disconnect Velunivo's Bluetooth session before Utility connects; avoid competing clients. Record scooter model, BLE/DRV/SHFW versions and original settings. Do not include pairing credentials, authentication material or identifiers in shared traces.

1. Read each original value and note its unit and range.
2. Change only headlight or one system timeout at a time in Utility. Capture the actual supported request/response where available, and distinguish headlight from rear light.
3. Verify the observed scooter behavior and a fresh read-back. Restore the original value and verify restoration.
4. Repeat for each relevant firmware version before implementing a version-gated capability. A beep alone does not prove read-back or persistence.
5. Separately test manual lock/unlock, auto-start/end options while stationary, moving-speed rejection, invalid-pairing repair, foreground/background recovery, and notification/Live Activity actions.

Report physical outcomes separately from automated software tests. The linked reports document Utility/probe scooter checks; native ride-control regression, simulator testing and physical validation of independent new writes are not established by those checks.
