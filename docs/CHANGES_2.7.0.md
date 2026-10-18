# 2.7.0 — native maps, synchronized Memories and lighter sync

## Map and layout corrections
- Hide MapKit's duplicate built-in compass; app orientation control remains.
- MapKit uses the same three bundled arrow images as MapLibre, loaded locally without a legacy RCTBridge dependency. Native camera callbacks rotate the navigation marker relative to the actual map bearing; custom arrow shadows are disabled.
- Landscape map controls use a compact horizontal native/fallback row below ride controls, with bounded portrait placement. Full-screen directions get a modal-local safe-area provider. Duo map/Library spacing is increased and large-screen Library cards no longer become a full-width single tile.
- Duo vertical controls are owned by UITabBarController.bottomAccessory rather than an outer navigation controller's toolbar, which overlapped the tab rail. UIKit owns accessory/tab ordering. Icons use compass/location and square/cube symbols.
- Vehicle list battery summary moves into the flexible text column; compact ride vehicle selectors include live or explicitly dated last readings.
- Route battery information uses compact icon/label rows for outward use, return use and charge at the destination. Detailed route restrictions remain available through inline information and the existing start warning.
- Shared badge vector artwork makes city-adventurer trophies and milestone badges identical on map pins and riders lists. Presence and GPS timestamps are separate, so connected riders with stale GPS still fade. Last-known navigation arrows also fade rather than disappearing.
- Transit retains connected station service tracks, uses a buffered overview query and merges stable IDs across viewports while fetching. Empty/failed requests retry rather than becoming permanent cached holes. Overlay geometry is bounded to 60,000 vertices.

## Memories and replay
- Recorded rides and Memories have a native-accessible scrubber, shared playback clock and playback speed.
- Memories are replayed as independently timestamped rider location/media tracks against the same absolute clock. Seeking moves all tracks; current media segments play together. Files remain separate for future editing; no destructive media concatenation.
- New Memories retain the recorder's own location track too. Only remote riders who explicitly permit Memories are included; revocation still removes their current-memory recordings. Original sensor records and legacy schema-1 Memories remain readable.
- Sample Memories include multiple moving rider tracks and visible rosters, clearly identified as sample data. They do not fabricate audio/video files.

## Data transfer
- Per-block DEFLATE level 1 is negotiated with newer peers and used only when it saves at least 12% after base64. Old peers continue plain text transfer.
- A bounded 2 MB ephemeral content cache lets repeat/return transfers reuse matching blocks. Hash probes and compressed blocks are gated by the existing two-device consent. No extra backup or credentials cache is written to disk.
- Compressed output allocation is bounded, Unicode block boundaries are preserved, and cached block hashes are verified before import. Received-size accounting is linear rather than repeatedly scanning all prior chunks.
- This is bounded block reuse, not a persistent revision database. Existing entity tombstones/settings timestamps and whole-data digests remain authoritative.

## Live Activities
- Velunivo ActivityKit starts and updates request a high relevance score, preserving priority when several activities compete for the Dynamic Island. iOS ultimately chooses presentation; the location-use indicator is system-owned. Simulator verification is required before calling the issue resolved.

## Validation checkpoint
- Earlier stable 2.6.1 build completed; gallery workflows reported success by reusing old captures, not fresh capture. Android phone capture failed at the sample-data switch. These remain under investigation.
- Short tests, CI compilation and actual Duo target checks will be recorded before release completion. No local native compilation or SDK download.

## Follow-up validation and capture repairs
- Chromium and isolated WebKit passed compact vehicle battery layout, last reading in the recording picker, vector badge pins, multi-rider Memories replay/seek/pause, mobile bounds and JavaScript-error checks.
- Native Memories uses one receiver-only media WebView for all synchronized tracks, avoiding a browser process per rider. Media seek waits for metadata; source documents remain stable across clock ticks.
- Screenshot capture finds only its owned app's data container through container metadata and falls back to CoreDevice installation after a Simulator install timeout. Android capture scrolls and verifies developer/sample switches instead of assuming an obscured tap succeeded.
- Lint and TypeScript validation passed; 478 application tests passed. Native compilation and fresh simulator/gallery checks are still pending; browser results do not establish native behavior or real scooter/media interoperability.
- Follow-up tests: 479 application tests and 53 workflow tests pass. Two synthetic MP4 tracks played together and paused in both Chromium and WebKit. WebKit rejected IndexedDB Blob writes in the isolated engine; new chunks now store copied binary buffers, while legacy Blob chunks remain readable (covered by regression test).
- Silent GPS stops now fade the local arrow through an independent, low-frequency opacity snapshot; unchanged opacity does not rerender the map. The unused iOS arrow fallback now also uses the shared artwork without the rectangular shadow, and offline maps honor local cosmetic previews.
- Post-push design/motion audit is in DESIGN_MOTION_REVIEW_2.7.0.md. It flags existing sheet-height animation, planner exit easing and JS-thread gestures rather than falsely approving all motion or bundling an unrelated redesign.
