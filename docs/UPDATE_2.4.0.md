# Velunivo 2.4.0 — implementation and verification

Resumed 16 October 2026 after the requested pause. Existing navigation, CallKit, Bluetooth protocols and battery estimation are retained. Native compilation and simulator capture run only on GitHub; no local native compilation or SDK/runtime download was performed.

## App changes

- Scratch reveals fade once over 720 ms, including paused replays. Animation is isolated from map geometry; on MapKit only highlighted polygons animate. Camera-bearing compensation keeps the position arrow oriented during rotation. Historical replay headings are precomputed with sustained compass/movement calibration, so seeking retains calibration.
- Every dedicated map picker uses a fresh device location, displays its marker and stops recentering after a gesture. Planner map selection similarly frames the current location without retaining an old route's bounds. GPS failure remains explicit; no location is invented.
- Leaders can lock a group while keeping its code, hide the locked code, and approve new members. Existing members can recover while locked; kicked members cannot. An optional global approval setting applies even to locked invitations. Pending requests appear above ride controls and in Live Activities; local notifications are opt-in, deduplicated, native only and never register for push delivery.
- Live Activity diagnostics cover navigation, recording, spectator, regroup, join approval, charging and stale data. iOS expanded/banner layouts have a straightforward bottom link row opening the relevant ride. Background updates retain localized action labels. These links open the app; they do not claim to approve admission in the background.
- Frequent-ride suggestions require at least three qualifying rides and a fresh location near the repeated starting point. Library preview rows include a fourth Show All card and compact secondary details. Vehicle batteries appear in selectors and on the planning map; confirmed charging uses green and a bolt.
- Full-screen welcome tour uses real responsive app captures in regular Pro device frames, independently of the What's New modal. iPad branding adapts to available width. Daily GPS-based challenges, nearby unexplored-area missions, additional achievements and five cosmetic accent themes add rewards without gating navigation or other core features.

## Private five-device mesh

`deviceMesh.ts` defines stable installation identities, bounded membership, pairwise credentials, introductions and revocations. Existing two-device associations migrate without replacing credentials or original dates. Each device has at most four active direct peers. Introductions are sent only over encrypted, authenticated paired channels using the configured private PeerServer. Automatic sync does not fall back to public signaling. File backup behavior remains unchanged and excludes secrets.

The graph retains revocation tombstones for delivery to offline peers. Membership uses active connectivity, preventing a disconnected/revoked device from recreating its old edges. Explicit new consent can create fresh keys. Native mesh data is chunked in SecureStore and committed via a generation manifest; corrupt saved data is reported rather than silently replaced. Browser persistence uses the existing localStorage model.

Entity edit/delete journals produce last-write-wins tombstones for vehicles, places and routes. Incoming item timestamps survive normalization and subsequent exports. Settings retain their actual edit timestamps. Archive imports/exports are serialized, and a lease permits only one large archive exchange per device at a time. A transport regression caught by browser testing was fixed: the receiver must accept the host's `chosen` control packet to create its automatic transfer engine.

## Verification

- Lint and TypeScript checks passed during development; final results below are updated before publication.
- Full TypeScript/JavaScript suite: 414 passing, including replay calibration and bounded mesh-transfer leases.
- Python tooling: 41 passing, including landscape idempotence, isolated simulator capture and gallery publication guards.
- Real local PeerServer plus five isolated headless Chrome contexts: all five agreed on ten pairwise connections and reported up-to-date data, no JavaScript errors. Three-device end-to-end data validation then confirmed vehicle deletion reached all devices; offline unpair reached the reconnected device and did not regenerate revoked edges. No JavaScript errors.
- Phone/tablet/desktop browser routes exercised without JavaScript errors or horizontal overflow. Native iPad safe-area/branding, local notifications, activity links and physical device compass behavior still require the resulting native build.

## Screenshot investigation

Beta hosted macOS runners stalled in CoreSimulator service/install operations for both device families. Larger paid runner execution was refused by the account spending limit; billing was not changed. Stable macOS 26 successfully installed/launched the existing ARM Simulator app. Its iPad capture exposed a double-rotation bug: rotating both before and after launch returned to portrait. Orientation is now checked from the actual framebuffer before rotating, and first-boot and gallery deadlines are independent. Captures are fresh disposable Pro devices, never user devices. Failed galleries must retain the previous published gallery and must never block binary releases. Fresh proof and final workflow changes are recorded after the diagnostic completes.

## Dependencies and limits

Added Expo SDK 57-compatible `expo-notifications ~57.0.23` for optional local notifications. No new backend service or Bluetooth protocol is introduced. Native changes require a new build; browser tests do not prove behavior on iOS or Android hardware. Neighborhood naming uses the existing reverse-geocoding provider and can fall back to a neutral area label if unavailable. Challenges do not authorize access to private land or provide safe routing by themselves.
