# Velunivo 2.5.0 — implementation and validation

## Native screenshots and onboarding

Android 17/API 37 phone (1280×2856) and landscape tablet (2560×1600) captures passed on the existing 2.4.1 APK in run 38930635646. Explore, Library, Vehicles and Settings are actual app framebuffers, verified with UIAutomator. Both families are staged in Fastlane distribution metadata and platform-specific onboarding assets. Obtainium downloads the APK from GitHub; its repository metadata can use the Android gallery. There is no separate Obtainium store upload.

Actual iPhone 17 Pro and 11-inch iPad Pro native captures were verified locally from the already compiled 2.4.0 Simulator artifact, using one disposable simulator at a time. Apple onboarding uses the provided iFrames artwork, including the iPad landscape frame. Android uses an honest generic bezel, not a mislabeled iPhone or an invented official Pixel 11 artwork. Browser onboarding uses browser screenshots. Screenshots remain outside README and binary release attachments.

Hosted iOS capture remains separately verified: a green job can mean explicitly marked fallback, not fresh capture. See SCREENSHOT_RELIABILITY.md for logs, root causes and follow-up runs. Binary release publication does not wait for gallery work, and fallback never replaces a valid gallery with a permission dialog or failed screen.

## Themes, layout and rewards

Theme accents now reach the route layers, scratch fill/borders/reveal, route markers, web focus outlines, buttons and original V logo. The logo uses its existing vector paths, with configurable foreground/background colors. Generated assets include separate backgrounds/foregrounds and themed SVG/PNG variants. A local Expo module and CNG plugin add native alternate iOS icons and Android adaptive launcher aliases, without changing deep-link activity routing. Changing installed icons needs the new native build; existing binaries safely skip the optional module.

Expanded ride panels follow the light/dark palette. Explore, recording and replay controls respect horizontal device insets, including folded layouts. Map control buttons have explicit centered dimensions. The wide iPad brand/search row uses the physical top inset instead of the native tab strip's larger content inset. Native fold/iPad visual verification is still required on the new binary.

Profile badges unlock at 20/100/500 XP; navigation arrow cosmetics at 40/200 XP. Main navigation features stay free. Daily discovery targets are 10–15 tiles; weekly target is 70. Today's neighbourhood chooses an unvisited area 800 metres to **10 kilometres** from the day's origin, with actual distance checked after H3 candidate generation. Completion requires real ride GPS within 350 metres of its selected centre. It is an area challenge, not a guarantee of legal/accessibility routing. Previously generated challenges remain valid for their day.

## Bluetooth and device sync

Partial or invalid telemetry updates retain the previous correctly timestamped reading. A different physical device and simulator session have separate caches. Presentation marks readings orange after a minute; live-speed and analytics freshness rules still apply. Charging is decoded from M365 BMS register 0x30, bit 6, not inferred from regeneration current. Physical charger validation is pending; no unsupported charging readings are invented.

Paired devices support local aliases. Connection setup gets 45 seconds before retry, instead of interrupting native ICE every 10 seconds. Heartbeats run every 3 seconds; established channels have a 60-second liveness window. Sync now requests an exchange on the live channel instead of destroying it. The existing merge/timestamp/tombstone format is preserved.

Two isolated Chrome contexts using the hosted private PeerServer merged separate saved places in approximately 3 seconds. Both showed up to date; manual Sync now also completed. This is browser end-to-end evidence, not a claim of new-build iOS timing.

## Memories and storage

Group rides expose optional Memories recording of already received audio, optional received video and permitted riders' location updates. No extra microphone, camera or GPS watcher opens. Video recording defaults off. A visible red Recording memories label appears in the rider list even if a video avatar replaces the profile picture. Profile & Group Riding includes Hide me from Memories. Missing consent from older clients is treated as denial. Opt-out stops inclusion and removes that rider's data from the current recording. Compatible clients cannot prevent a recipient using external screen-recording software.

Media and location chunks stay on the recorder's device. Memories media is intentionally not included in sync or backup files, to avoid silently broadcasting large private recordings or exceeding archive limits. Library → Memories browses, plays and deletes local memories. Settings → Storage measures persisted UTF-8 records, media bytes, native files and cache; filesystem/database overhead can differ from system Storage totals.

Native recording uses an isolated receiver-only WebView MediaRecorder and a local WebRTC connection, forwarding only already received, consent-filtered tracks. A narrowly scoped react-native-webrtc patch resolves received track IDs on their original peer connection; it does not change capture, firmware or CallKit. Native media forwarding requires a fresh build and device validation. OS suspension can pause recording; continuous background Memories recording is not promised.

The real browser loopback test uses generated audio/video, checks saved bytes and verifies playable video metadata. It produced two chunks (~49 KB) without page errors. Persistence tests verify exclusion, opt-out cleanup, timestamps and file identifier validation. A failed save reports failure and permits retry rather than claiming it succeeded.

## Notifications and diagnostics

The notifications currently added are **opt-in, silent local notifications** for group join-approval requests and regroup requests. They are deduplicated per event for one minute. They do not register push tokens or send notifications through an account backend. Android's existing ongoing ride/Live Update notification is separate.

Debug Logs replace the Launch Logs label. Logging is off outside Developer Mode; Developer Options has an independent off switch. Each cold launch has a session, seven-day retention and ZIP export. Logs include lifecycle, errors, request timings, Bluetooth operation/read-only register response diagnostics, peer/sync state, device/window metadata and significant event-loop delays. Credentials, auth frames, media and precise coordinates are excluded/redacted. These are diagnostic logs, not an analytics upload service.

## Releases and developer history

Development has no push workflows; testing publishes prereleases; main publishes stable builds. Successful stable builds automatically trigger galleries and AltSource, while prereleases do not. Gallery metadata commits skip CI to prevent recursion. The special mutable 1.0 AltSource tag is unchanged. All commits/tags remain unsigned.

The developer changelog includes commit titles, bodies and revision IDs for all historical stable tag ranges, with a separate developer-only submenu. Build preparation generates the complete history before distributing it to web/native jobs, avoiding shallow-checkout omissions. Public highlights remain capped at three; detailed user changelogs stay separate.

## Validation

- TypeScript and Expo lint checks passed with no warnings.
- 424 JavaScript regression tests passed, including memory persistence/consent, charging, retained telemetry, storage and 10-km challenge bounds.
- 48 Python capture/release tooling tests passed using Python 3.12.
- Isolated Expo prebuild generated both native projects: four iOS alternate asset sets/build settings and five Android launcher aliases, with deep links retained. No local SDK download or local native compilation was used for this check.
- Web export and actual two-browser private-server sync; real browser media capture/playback.
- New native compilation and physical Bluetooth charging / Memories validation remain required before claiming those targets verified.
