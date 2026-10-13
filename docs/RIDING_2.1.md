# Velunivo 2.1.0 — riding and exploration

## Changes

- Battery-aware planning combines the existing learned energy model with fresh real Bluetooth charge from a paired and connected vehicle, a configurable reserve, and an optional return to a saved place or the ride’s starting point. The return leg is routed from the final destination, including multi-stop journeys. Same-route return remains an option and reverses elevation so ascent is not blindly doubled. Planning attempts reconnection through the existing shared Bluetooth manager. Missing or stale charge hides the battery plan; sharing scooters and simulated battery readings are excluded. There is no manual charge input. Estimates never guarantee range.
- Navigation and recording can save one-tap private bookmarks. They appear in Saved Places immediately, and in the recorded ride and replay when recording is enabled. File backups and peer transfers retain their stable IDs.
- Profile contains exploration levels, XP, six achievements and a weekly discovery goal. Progress is derived from stored rides and detailed scratch tiles, including older records. Earned XP and achievements are retained across deletion and scratch resets; merges take the highest score rather than awarding duplicate XP. Following a reset, the current total must exceed the previous high-water score before XP increases again.
- Group members can request a regroup. Navigation and recording show a red safe-stop warning; native Live Activity content includes it. Only its requester or leader can clear it. Requests expire after ten minutes and are rebroadcast for recovery. CallKit, microphone and camera internals are unchanged.
- Optional navigation haptics use the same medium cue for turn approaches and a different notification for a sustained off-route event. Duplicate sensor updates do not repeat cues; rerouting resets their identity. Availability depends on device and system settings, including camera use and low-power mode.
- Developer analytics contain ride reliability summaries and an aggregate JSON export: GPS quality, estimated speed samples, longest GPS gap, real Bluetooth interruptions and peer reconnects. Export does not contain coordinates, media or credentials. Older archives acquire summaries during archive repair.
- Global bicycle route preferences favour cycleways, quieter roads and fewer hills. Online Valhalla requests and proxy cache keys incorporate them; offline graph routing supports cycleway/quiet-road weighting but has no elevation data for hill preferences. Car-road routes retain their existing costing and safety warnings.
- Scratch rendering aggregates resolution-10 tiles into resolution-9 or resolution-8 parents at wider map extents. Any visited child reveals that display parent; raw stored tiles and dates remain detailed. Coarse tile inspection reports the earliest/latest child visits. Parent aggregation replaces the previous expansion effect and is bounded to avoid revealing city-sized regions.
- Panning or zooming during navigation or recording pauses following until eight seconds after the last user interaction. Sensor refreshes do not restart or shorten this timer; the location button resumes immediately.
- The rider video pin button uses a diagonal solid pushpin, muted when unpinned and accent-coloured when pinned, matching the supplied reference.

New user-facing strings have English, Italian, Spanish, French, German and Portuguese coverage. The version is 2.1.0; the special AltSource 1.0 container is retained. Release highlights show three main features with the full details in the existing changelog submenu.

## Affected areas

Core models and persistence: batteryPlan, recordings/rideArchive, explorationProgress, rideReliability, navigationHaptics, routePreferences, preferences, syncSettings and dataTransfer. UI: Explore, recording, replay, profile, settings, maps, group controls and developer reports. Services: recorder/navigation lifecycle, shared activity extras, routing and exploration storage. Native source: Live Activity regroup content. No additional dependencies or local native compilation.

## Deployment and limitations

Update the hosted routing proxy with this revision to honour the new route-preference request fields. The PeerServer protocol and deployment do not need an update for these changes. Group regroup packets are ignored by older clients, so update all group members for the warning to appear consistently.

Haptic effects, native map gestures and regroup rendering on a physical iPhone/Android require the new native build and hardware validation. Automated logic tests and web checks do not establish physical-device results. Existing iOS background execution limits still apply. Reliability counts describe observed data, not a guarantee of GPS, BLE or peer network quality.

## Validation

Validation results are appended after final checks. Native compilation is performed only by GitHub Actions; no local SDKs are downloaded.

Final checks: lint and TypeScript passed; 358 app tests and 38 Python workflow tests passed. The final targeted feature/localization checks passed after the return-location addition. Production web export succeeded. An isolated headless Chrome session verified current-location scratch opening, unchanged stored tiles while browsing, recording, immediate bookmark persistence, profile achievements, route preferences, and the persistent return-location picker with no manual charge input. A real mouse-drag test confirmed GPS does not recenter during browsing and following resumes after eight idle seconds. Screenshots were inspected locally and were not added to README or binary release assets. Physical Bluetooth battery planning, haptics and native regroup Live Activity rendering remain device-validation tasks.
