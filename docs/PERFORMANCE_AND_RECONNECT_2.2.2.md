# 2.2.2 — reconnect, exploration, transit and performance follow-up

## User scope and baseline

2.2.1 is published and deployed as the comparison baseline. This follow-up implements the resumed requests: external maps in the route-picker sharing menu, genuinely different exploration alternatives, viewport-sensitive transit coverage, Bluetooth reconnect investigation, and the previously authorized performance review. No local native compilation, SDK download, CallKit/media protocol changes, or firmware-setting changes were made.

## Bluetooth investigation

Comparing v2.1.1 with the 2.2.1 application commit found no Bluetooth source/native module changes. This does not establish a hardware-specific root cause. Inspection exposed two existing lifecycle flaws: a ride lease explicitly reconnected after acquire had already requested connection, and simultaneous reconnect callers could both drop a session around authentication. The entire reconnect operation now coalesces for one vehicle and the lease has a single owner. Successful authentication persists newly issued credentials for existing associations, before declaring the connection connected. Credentials are copied during authentication so a failed attempt does not overwrite saved credentials. Rejected saved tokens still require explicit re-pairing; Velunivo does not repeatedly register without consent.

Files: bluetooth/bridge.ts, bluetooth/react.tsx. Tests exercise concurrent reconnects, credential persistence, refusal handling and failed re-pair rollback. These are transport fixtures, not a claim of physical Pro 2 validation. Hardware reconnect testing remains required.

## Routing and transit

The route-sharing menu offers Open external maps immediately above Export GPX. It uses the same optional-recording consent as planner/failure redirects. No general external-map control was added to active ride controls.

Ordinary exploration alternatives use one continuous provider itinerary, matching the connected-loop fix. Candidates must cover a meaningful different unexplored corridor and fit the existing distance/time budget. Advisory access-verification warnings remain visible and require review; they no longer silently exclude all exploration alternatives. Identical paths are rejected.

Transit viewport updates work independently of scratch-map visibility on web and Android. Vector tiles remain the inexpensive overview layer; cached OSM geometry supplements missing lines and updates after pan/zoom on all map implementations. Requests are quantized, debounced, coalesced and cached across stale viewport requests; completed results are retained even when the requester moved away. City overviews up to 1.5 degrees are allowed, with a second public provider on failure. Continental requests are bounded and use the vector layer on MapLibre. iOS uses mapped infrastructure rather than Apple's unavailable full-transit renderer. Rail remains DodgerBlue, metro/tram muted rose, beneath ride routes. Infrastructure is not a timetable or guarantee that scooters are permitted.

## Performance review

- Paired-device idle heartbeats previously exported/hash-serialized the complete archive twice every ten seconds. A 20,000-sample fixture produced about 26 MB of canonical text and spent about 258 ms in canonical serialization on this Mac. Unchanged heartbeats now compare source metadata and reuse their digest, including invalidation for settings, credentials, keys and imports. Actual transfers still validate/export all samples.
- Canonical hashing streams in bounded chunks and yields after short time slices. Tests prove identical digest output to the existing format, including dates, integer keys and Unicode split boundaries. No peer-server protocol change is required.
- Parsed ride summaries, unchanged derived state and native coordinate buffers are reused. Archive updates come from notifications, foreground refresh and cross-tab storage events instead of a root-level ten-second poll. Refresh events during an in-flight refresh are replayed.
- Inactive planner/recording tabs stop idle GPS watchers and clocks; active navigation/recording continues off-screen.
- Scratch geometry caches projections, parent cells and recent unions, with bounded caches. On the same 10,981-cell/40-pan fixture, median generation decreased from 9.02 to 6.62 ms; p95 from 14.01 to 11.78 ms. Worst frame remained about 28 ms. This is a modest CPU improvement, not proof that all native stalls are eliminated.

New helpers: core/canonicalHash.ts, core/digestCache.ts, core/nativeCoordinates.ts, services/automaticSyncDigest.ts. No new dependency or persisted schema change. Existing private data remains private and is not logged. The static hosted build must be updated from the matching release artifact, preserving rollback and verifying version/revision and signaling.

## Validation

Lint and TypeScript passed; 384 application tests and 38 Python workflow tests passed. Own isolated Chrome exercised real public bicycle/car routing, confirmed an Explore · Bicycle alternative and tested external-map consent from the route-picker share menu without JavaScript exceptions. A separate browser test confirmed distinct transit requests after pan and zoom with scratch visibility off; that test mocked the geometry service while using real map tiles. Exploration selection and transit viewport tests cover novelty, overview bounds and panning changes. Native BLE, iOS background behavior and native visual performance require device validation. No local native builds were run.
