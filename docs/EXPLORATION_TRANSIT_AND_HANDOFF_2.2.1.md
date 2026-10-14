# 2.2.1 — connected exploration loops, transit overlays and external-map recording

## Changes

Exploration uses one continuous bicycle itinerary request, so all stops share the provider's snapped junctions. Candidate directions cover the compass rather than one small sector. Both legs are scored for unexplored coverage, including return tiles outside the outward corridor. When nearby roads are already explored, a real usable loop is retained with an explanation instead of rejecting it. Empty, disconnected or unreasonable geometry still fails cleanly.

Detailed road attributes are not queried separately for every loop leg. Bicycle costing retains its road preferences and exclusions; access remains explicitly unverified and is reviewed before recording starts. The existing recording dashboard gets road-limit readings independently. No invented connecting segments, telemetry or routing are displayed.

Outward route geometry is green; the return is gray and drawn underneath it. Route metadata preserves the turnaround index. In a navigation context, the return becomes the active green segment after the turnaround is passed.

Transit lines are thin DodgerBlue for rail/monorail, and muted rose for metro/light rail/tram. Yard/siding/spur infrastructure is omitted. Native overlay coordinate arrays and nodes are memoized, and viewport queries refresh as the map moves. Apple MapKit does not expose Apple Maps' full transit presentation through the current map component, so mapped infrastructure remains the supported overlay. It does not imply timetable availability or scooter carriage permission.

Apple route ordering receives a version-checked, idempotent dependency patch: route polylines use MapKit's above-label overlay level and sort by their existing z-index. Other polylines stay at the road level. This avoids depending on React child ordering after an asynchronous transit update. Native cache identity includes the patch. Compilation runs only in CI.

External maps is available only in the planner and the no-route-found dialog, per the latest user correction. Every redirect asks whether to record. Recording snapshots the selected vehicle and waits for a new GPS fix; native handoff also waits until the existing background location task has started. A denied permission does not silently hand off while claiming to record. Web explicitly requires keeping the page visible; it cannot promise native background execution. The recording session remains active until the user ends it, and its ordinary distance/battery/group rules remain unchanged.

All added copy is translated into the six supported languages. Old 2.2.0 highlights are restored to the three-feature format without changing its version.

## Validation

Lint, TypeScript, 376 app tests and 38 Python workflow tests passed. Five consecutive real public-Valhalla loops generated in headless Chrome. The planner consent flow opened the recording dashboard; external controls were absent from the recording dashboard. No JavaScript errors were observed. Unit coverage includes both leg colors / order, warning-tolerant ranking, direction diversity, transit colors, redirect readiness and native patch idempotence. Native background handoff and rendered MapKit overlay ordering require device validation; no local native compilation was performed.

## Next phase

The user explicitly authorized the performance/code review immediately after pushing and starting this build, superseding the earlier hold. Keep this version as the feature baseline and publish reviewed performance changes separately. Every release must deploy and verify matching hosted web.
