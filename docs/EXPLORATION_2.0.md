# Velunivo 2.0 — exploration and rider profile

## Scratch map

The collection preference defaults **on**, while display defaults **Never**. Settings → Scratch map independently controls collection and display (Never, Home map only, Home map & rides). View scratch map opens a separate full-screen map outside the tab bar. Tap an explored area to inspect its first/latest visit dates. Disabling collection preserves existing exploration.

Collection consumes the **raw GPS Fix** already delivered to real navigation (`useRide`) or trip recording (`useTripLocation`), including their existing locked-screen/background deliveries. It installs no location watcher or background task. Home-map location, planning, simulation, replay and other group riders never feed the index. Force-quitting does not resurrect a session. Existing OS background-location restrictions still apply.

The underlying H3 grid has a permanent resolution of **10**, with tiles roughly 150 metres across (actual shape/size varies geographically). Only cell identifiers and first/latest timestamps, an optional originating ride identifier, modification timestamp and approximate-recovery flag are stored. There is no extra scratch path or GPS timeline. Accuracy over 25 m, stale/out-of-order fixes and implausible jumps are rejected. Boundary crossings require an interior fix or consistent observations, rather than scratching a radius around every inaccurate GPS fix. No road snapping or compressed route geometry is used during a live ride.

Presentation follows the requested Bump-like approach: adjacent visited cells become rounded clear corridors in a continuous accent-colour fog. There are no lines between individual hexagons. Native Apple Maps polygons support holes; native/web MapLibre use GeoJSON polygons. Unvisited islands inside an explored loop remain covered. Fog opacity is approximately 34% on home/viewer maps and 14% while riding; route lines and people pins remain above it. Rounded contours are a visual treatment, not a change to the stored tile index.

A completed real session that uncovered new cells, with collection and display enabled, produces one dismissible recap banner. Opening it highlights that session’s **new** areas in the full-screen map; closing or dismissing consumes the recap. Revisited tiles update dates without being presented again as new discoveries. The banner does not interrupt the existing arrival screen.

**Recover from recorded rides** reads stored timestamped raw GPS samples first. Legacy rides without samples use preview/trace geometry with conservative interpolation only over short gaps, explicitly marked approximate. Recovery is repeatable and merges first/latest dates without duplicate cells. **Reset scratch map** requires confirmation and keeps recorded rides. Reset timestamps prevent older sync state reviving erased cells; deliberate recovery can restore historical visit dates after a reset. Scratch data is included in backups and device sync. Older backups remain readable. These are sensitive location-history data even though represented by cell identifiers; they stay local unless explicitly backed up/synced.

Storage is checkpointed every five seconds and on background/end transitions. Dates within the current cell are coalesced during a session; the final accepted visit timestamps are flushed at completion. Concurrent fixes arriving during a storage write remain dirty for the next checkpoint. Collection/recording can proceed independently: disabling automatic ride history does not disable a deliberately enabled scratch map.

## Exploration routes

Settings → Navigation & audio and the planner vehicle card expose **Explore new areas**, off by default. Normal bicycle/car routes appear first and remain available. Optional extra candidates use real routing through nearby unexplored cell centres; they are offered only when the resulting path discovers more cells, adds at most 25% distance, and has no reported safety restrictions. Existing restrictions/unknown access remain subject to the normal route review and signs. This feature is not permission to ride on a road.

Explicit user stops are preserved; additional exploration detours are not inserted into an itinerary that already has stops. No straight-line navigation is fabricated. Provider failure or lack of a useful short detour leaves normal candidates untouched. Starting a ride or beginning another plan cancels adoption of late exploration results. Only requested detour coordinates/endpoints reach existing routing providers; the full exploration index is not uploaded.

## Profile and vehicle care

Settings → Profile & Group Riding has a centred picture/name card with picture actions below the avatar. **Ride statistics** lives inside this profile section and shows saved-ride distance, duration, average including stops, longest ride, per-vehicle use and total explored tiles; calendar filters support all time/month/year. It uses existing records, not a separate passive tracker. Estimated GPS speed remains an estimate.

Group creation/joining reuses the configured profile and displays its preview with an Edit profile footprint link. A name is requested only when no saved name exists. Voice/camera/CallKit behaviour is unchanged.

Personal vehicles have a **Maintenance** submenu for named distance/time reminders (tyres, brakes or custom service), edit, enable/disable, Mark serviced and deletion. Due reminders appear in vehicle settings and expanded ride controls. They are **in-app reminders based on recorded distance and service dates**, not mechanical diagnostics or scheduled push notifications. Public Sharing E-Scooters have no maintenance menu. Stable reminder IDs, edit timestamps and deletion tombstones avoid repeated-sync duplication or resurrection.

## Native update checks and release history

Native Settings checks published GitHub releases and compares numeric Major.Minor.Fixes components. Drafts, prereleases, the mutable `1.0` AltSource release and releases without a platform binary are excluded. Checks refresh when native Settings is focused or foregrounded and are cached for six hours, with a manual refresh and bounded network timeout. Open update opens the binary release page; installation remains with the user’s usual sideload/update tool. Official/fork workflow builds embed `EXPO_PUBLIC_UPDATE_REPOSITORY` from `github.repository`; manually built forks can set that variable. No account/token or auto-install permission is needed.

Every historical What's New overview now contains at most three big highlights. Smaller changes are represented only by one Fixes & Improvements item when a slot remains. Full detail is retained behind Show full changelog in a separate submenu. Historical version numbers/tags are unchanged; the user explicitly authorized **2.0.0** for this feature set.

## Dependency and validation

Added `h3-js` 4.5.x, pure JavaScript, Apache-2.0. No native module, SDK download or local native compilation was added. H3 indexing and polygon APIs: https://h3geo.org/docs/api/indexing/ and https://github.com/uber/h3-js. Expo SDK 57 Router APIs and GitHub releases REST documentation were checked before integration.

Tests cover GPS/session/visibility gating, stable tiles, timestamp merge, reset/recovery, one-time recaps, continuous holes/islands, concurrent checkpoints, maintenance thresholds/tombstones, legacy backups, semantic update selection, profile statistics and exploration constraints. Headless Chrome used a separate temporary profile and synthetic public Rome positions; no user browser, private GPS, scooter, microphone or camera was accessed. Browser QA verified tablet/desktop/phone layouts, tile-date inspection, profile/statistics/changelog screens, maintenance servicing, saved-name group preview, real recording UI with emulated GPS, one-time recap, confirmation before reset and recovery from that saved recording. The QA recording saved one ride and three explored cells; reset removed them and recovery restored all three. Screenshots remain local QA evidence, not README/release assets. Physical Apple Maps/Android rendering, native update UI and locked-screen collection still require the resulting native build.

Final validation: **344 JavaScript/TypeScript tests and 31 workflow tests passed**, lint/typecheck and whitespace checks passed, and the production web export succeeded. Browser flows reported no page exceptions. The existing 1.2.1 build/release completed successfully before this release was dispatched.
