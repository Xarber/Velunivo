# 2.7.2 testing checklist

Use the **normal testing build**, not the earlier development-client build. It should open the app directly without an Expo launcher or a connection to the Mac. Install the same testing build on both devices. The version remains 2.7.2; include the build number/commit when reporting results.

## Prepare logs first

1. Settings → tap the version three times → enable Developer Mode → Developer Options → Debug Logs.
2. Turn **Record debug logs** on. Enable **Verbose diagnostics** for Bluetooth, syncing, media or performance investigations. Verbose is off by default and requires recording to be on.
3. Force-close and reopen once, then reproduce the issue. This gives the startup, version/platform, screen/orientation, lifecycle and relevant errors a clean session.
4. Afterwards use **Download all logs** on **each device involved**. Save/share the ZIP to Files and attach it to this chat. Regular and verbose events are in the same archive. Leave Developer Mode on until export is finished; turn verbose/recording off afterwards if desired.

Regular logs include app events, console warnings/errors, Expo/native-module errors reported to JS, fatal JS exceptions and unhandled rejections. Verbose adds bounded console info/debug/log output, Bluetooth read-only register responses, normalized telemetry, recognized-device advertised services/RSSI and exposed native service/characteristic properties. Existing HTTP/peer/app timing diagnostics share the same archive. No arbitrary authentication packets or media are captured. Credentials, URLs, precise coordinates and sensitive fields are redacted. Logs expire after seven days.

A fatal process/OS crash or JS failure before the logging module can start may not finish saving. For those, also attach the native crash report: iOS Settings → Privacy & Security → Analytics & Improvements → Analytics Data → the relevant Velunivo `.ips` file. On Android attach the app's system crash report/logcat if available. Do not send pairing codes, API keys or passwords.

## First: layout and app navigation

- [ ] iPhone, iPad and Duo: all four system tabs appear when idle; tapping each actually opens its page. Repeat after resize, rotation, opening a deep link, finishing a ride and returning from background.
- [ ] Duo unfolded: map controls are visible in the system accessory/sidebar area and do not overlap tabs or disappear. Phone controls remain compact and centered. Search is first; orientation and 2D/3D icons work.
- [ ] Your Ride starts at the bottom with a visible Plan a ride button background. Expand/collapse immediately after launch and after rotation; no top-floating panel or tall empty shadow.
- [ ] Landscape navigation: directions and ride controls have matching compact widths, controls remain reachable, speed/limit stay visible, and the map centers in its free area. Rotate without manually recentering.
- [ ] Full turn list and other popups respect safe areas and keep landscape. Expanded recording controls can reach the top without hiding scrollable content.
- [ ] During a real navigation/recording the four tabs hide; Settings offers the correct **Back to navigation** or **Back to recording** action. Ending restores normal tabs.
- [ ] Replay and Memories: expanded landscape controls are taller than collapsed controls; the entire panel scrolls, including long rider names/telemetry. Timeline seeking, pause, rates and back/forward work. Rotate and check camera centering.
- [ ] Library has no white edges on Duo, cards have reasonable widths, and Show all appears only when more than three entries exist. Memories show stacked rider avatars; downloads show previews.

## Maps and customization

- [ ] Switch native navigation arrows among the available designs; each actually changes, stays visible and has no square shadow. Repeat on web. No MapKit compass floats in the middle of the map.
- [ ] Classic, halo and diamond rider pins keep faces/initials centered and correctly clipped. Web/list badges use the same artwork. Badges can overflow the face, stack correctly and fade with stale connection/location.
- [ ] Pan away while riding; updates do not immediately recenter. After about eight seconds without interaction, following resumes. Heading follows an actual turn, not the next route tangent.
- [ ] The first map opens at its last remembered area, then actual GPS; pickers use current position with a marker. A remembered viewport must not scratch tiles or pretend to be a GPS fix.
- [ ] Transit: pan to a different part of Rome, zoom into it, and wait for nearby lines. Existing geometry stays while new cells load; trains are blue, other transit muted mauve, navigation stays above both. Note the area and waiting time for missing lines. Wide views load the central nearby cells within bounded budgets; public-provider outages can still limit coverage.
- [ ] Scratch map: all display modes, recording preview, discovery from fresh GPS, live/replay finite glow, zoom aggregation, bright inner/outer boundaries, tile details, old-ride recovery and reset confirmation. The glow should end without waiting for another tile.
- [ ] Theme accents, reward arrow/pin/badge designs, profile rewards and the temporary developer unlock. Developer-only unlocks reset on restart and do not advertise unearned rewards to peers.

## Plugin framework

- [ ] Fresh/default state: disabled bundled examples do not reveal Plugins in Settings.
- [ ] Developer Options → Show plugins menu reveals it. Enable examples one at a time: route card, telemetry widget, ocean accent, transit shortcut and persistent local counter. Each contribution disappears when disabled, restoring the selected theme.
- [ ] Install this package through the Plugins URL field: `https://raw.githubusercontent.com/Xarber/Velunivo/development/examples/plugins/installable-demo.json`. Review permissions; install must leave it disabled. Enable it, restart, and check automatic loading. An external installed plugin keeps the menu visible. Remove it and verify its contribution disappears.
- [ ] Invalid/non-HTTPS URLs or incompatible JSON show a concise error rather than crashing. Native sandbox/Worker support still needs this physical-device check.

## Bluetooth and battery

- [ ] Sharing E-Scooter cannot pair, has fixed name/icon, editable speed/ETA limits, usage statistics and no battery-use prompt.
- [ ] Personal scooter: initial discovery/authentication, saved reconnection, opening Bluetooth settings, starting navigation/recording, disconnect/reconnect and background/foreground. Saved credentials should not repeatedly trigger new pairing. If pairing was invalidated by another scooter utility, the app should offer to pair again.
- [ ] While connected only Disconnect is shown; while disconnected Connect, Replace and Forget have the requested layout.
- [ ] Battery/speed/other fields retain their last valid value rather than alternating with Unavailable. A sufficiently old value becomes marked old. Charging shows a green battery/lightning indicator.
- [ ] Battery is below the complete speed-limit text; picker, vehicle list and detail page show live/last-reading provenance. Navigation's disconnected estimate appears only with enough real history and a recent reading, never merely the assumed planning charge.
- [ ] Bluetooth rides and sharing vehicles skip manual battery-use prompts. Manual feedback updates the last battery. Check learned predictions, reserve/return location and older-ride analytics, especially on hills/different modes. Advanced analysis must omit unsupported measurements rather than inventing them.
- [ ] With Verbose diagnostics enabled, export afterwards: Bluetooth service/characteristic metadata, read responses, sample timestamps, reconnect failures and console warnings should be present in the same ZIP. No additional firmware writes are introduced.

## Device syncing and backups (both devices)

- [ ] Existing paired devices reconnect, can be renamed and offer manual Sync now. One end-to-end progress indicator includes both transfers and explicit Applying settings/Finishing states.
- [ ] Add/edit a harmless test place or vehicle and a setting on one device; sync both ways. Latest configured setting wins, repeated sync does not duplicate records or restart indefinitely. Record whether either device stays at Preparing/0%.
- [ ] Delete an intentional test vehicle; syncing must not recreate it. Test offline unpair/revocation and the up-to-five-device mesh only if you intend to change the current pairing configuration.
- [ ] File backup creation/list/download/import works, including archives larger than 5 MB on web. File export excludes Bluetooth credentials/API keys; private-peer sync includes allowed secrets. A public-server fallback must not transfer those secrets.
- [ ] If logs contain a Keychain entitlement/access error, report installation method and which device; do not erase your data or repair/unpair repeatedly. This error was observed during the development-client session and needs distinction from network failures.

## Group rides, calls, Memories and sharing

- [ ] Creating a group requires an activity. Joining replaces navigation/recording with the group's activity and route, saving the previous eligible ride. Joining a recording group starts fresh recording. No Join button while already grouped; ending activity leaves.
- [ ] Leader/order recovery, eight-person limit, lock/unlock with unchanged code, reconnect of admitted members, kicked-member exclusion, join approval and regroup notices.
- [ ] Microphone/camera start only when explicitly enabled and another eligible peer exists. Camera starts off on entry. Muting microphone/camera stops capture, not just output; media recovers after network/background interruptions. Voice-disabled members never join the call.
- [ ] Both directions of audio/video work with iPhone+iPad and native+web. Remote and own list previews, pinning from map/list, one small priority rectangle, hide on retap and per-recipient video preferences.
- [ ] CallKit system name is Velunivo Group Ride; Connecting/connected state, mute and hangup work. Hangup disables voice in settings, and a lone user has no active group call/capture.
- [ ] Memories record only allowed media/location updates, show the recording indicator to everyone, respect Hide me from Memories, and replay all recorded tracks together. Sample Memories deliberately have no actual audio/video; test a real short permitted recording for media playback.
- [ ] Live trip sharing starts hosting, copies one link, connects native/web spectators, counts unique viewers, recovers after reconnect/background and hides private dashboard values from spectators. Live sharing is absent from plain recording.
- [ ] Route links/native deep links replace the right activity, show loading feedback and support web. Imported/shared multi-stop routes preserve stops, directions and library labels.

## Live Activities / Live Updates

- [ ] Navigation, trip recording and shared-trip monitoring layouts: lock screen plus compact/expanded Dynamic Island. Recording uses a record icon/timer. Arrow/distance placement, battery/stale state, eye/viewer count and group/person count remain unclipped.
- [ ] The custom activity stays available when backgrounded rather than only the default iOS location indicator. Repeat after notifications, returning to app and ending the ride.
- [ ] Join approval shows the person's name and accept/reject controls without a tall overflow row. Regroup warning appears in navigation and recording. Developer tests cover all three layouts plus independent toggles.
- [ ] Android: verify Live Updates behavior separately; an iOS result does not certify Android.

## Remaining regression sweep

- [ ] Planner automatic search, Enter spinner completion, saved-place suggestions, map-to-address loading, stop dragging, exploration candidate/retry caching, updated distance/battery, round-trip outbound/return colors and external-map recording checkbox.
- [ ] Start with denied/unavailable GPS: a clear warning and exit. Short-ride rules, arrival auto-end/return home, conservative GPS cleanup and replay follow direction.
- [ ] Offline-area rectangle, automatic place names, button-fill download progress, immediate list refresh and offline network/routing boundaries.
- [ ] Profile rewards, daily/neighborhood challenges (up to 10 km), maintenance reminders, frequent rides only near the matching start, statistics, reliability/energy/calibration comparisons and local notifications.
- [ ] Languages/System selection, long labels, large text, keyboard-safe forms, one-field popup autofocus, TTS default/high-quality selection and voice pagination. Welcome/What's new separation, real native previews, developer notes/commit on web and diagnostic/GPX visibility gates.

## What to attach

For each problem: **device/model + OS + installation method + testing build/commit**, exact steps, expected/actual result, approximate local time, foreground/background and network state, and a short screenshot/video if visual. Attach the **Debug Logs ZIP from both devices** for sync/group/media issues, or from the scooter-connected device for Bluetooth. For a crash add its `.ips`/Android crash report. Say which side sent and which side failed to receive. Normal production-style testing does not require Metro; the earlier development session's Mac log is retained separately if needed.

This is a test plan, not a declaration that all checks passed. No further device tests were performed after the request to stop.
