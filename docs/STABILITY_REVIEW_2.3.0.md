# Stability review and UI follow-up — 2.3.0

## Scope

Deep review of Bluetooth failure paths, exploration selection, direct-link navigation, settings and expandable UI. Added the subsequently requested cold-launch diagnostics and vehicle performance analytics. The minor bump reflects the new diagnostics, settings search and analytics; the three-item overview follows the existing format. No new dependency, local native compilation, SDK download, PeerServer protocol or CallKit/media change.

## Bugs found and addressed

1. **UART deadline started before write completion.** Native writes can wait for notification readiness or a busy radio longer than the 1.8-second response timer. The old waiter could time out, start another exchange, then let a late write rejection erase its successor. VehicleRequestChannel installs matching before writing, starts the deadline after write acceptance, handles immediate responses, and isolates late results/cancellation.
2. **Authenticated Xiaomi sessions fell through into legacy registration.** The identity read caught every error and tried another crypto family, including when Mi FE95 had already authenticated. Mi/transport failures now remain failures of that session, rather than generating another legacy headlight approval. Only a non-Mi plain-protocol response timeout may try legacy crypto.
3. **Pending native writes survived session close.** Closing now rejects bounded pending operations immediately and cancels their transactions. A timed-out write poisons its transport session; queued writes cannot continue against the stuck radio. Existing write-type selection and packet framing remain unchanged.
4. **Late disconnect completions overwrote newer state.** Generation checks prevent a previous session's teardown from announcing disconnection after a replacement has connected. Authentication also rechecks its generation after credential persistence.
5. **Global Back counted tab history as page history.** Reproduced in isolated Chrome: a cold /settings/general link sent Back to Explore. Back now pops only a genuine stack, otherwise replaces the correct parent. Remaining raw Back buttons use this helper. Replacement adds no forward stack entry.
6. **Automatic exploration work conflicted with selection.** The route picker now owns exploration. Per-candidate cached originals and exploration results restore immediately when toggled. Only initial generation and explicit Retry perform searches. Retry varies detours and rejects the prior exact geometry. Mandatory stops are preserved and bicycle/car costings follow the chosen candidate. Old persisted preference fields remain compatible, while the obsolete automatic UI preference is removed. Planner/start/share controls are disabled during generation; clearing invalidates late results. Elevation enrichment preserves an already selected exploration result.

Bluetooth unit/transport tests exercise timing, cancellation and saved pairing recovery, not physical hardware. The reported native write timeout may still have radio/firmware/system causes; the added logs provide actionable evidence. Do not claim the real scooter is fixed until tested.

## UI

- Exploration button in the route picker, with a smaller Retry action only while selected. Only the clicked action shows a spinner.
- Expanded recording exploration, scheduling and return-place options have tinted nested cards; the vehicle picker is preserved.
- Schedule departure is above the endpoint selectors, becoming Depart now when expanded and unscheduled.
- External-map confirmation has a recording checkbox and selected vehicle in the same dialog. One confirmation launches the redirect, waiting for recording/background readiness when requested.
- Maintenance switch sits at the upper right with a small vertical offset. Edit/delete are inline to the right of Mark serviced.
- Settings search indexes translated titles and aliases, including GPS, language, offline maps, battery, Bluetooth metrics and group controls. Selection opens the section and measures the matching scroll anchor.

## Private diagnostic logs

One session per JavaScript cold launch, unaffected by root/provider remounts. App lifecycle/errors, Bluetooth transitions/write metadata and network timings are logged. No coordinates, authentication bytes, API keys, media, address query strings or packet bodies are logged; structured redaction adds a second layer. Events persist in bounded 250-event chunks, with one-second batching and immediate error/background flush. Logs older than seven days are deleted on launch, foreground and export. They are not included in backups or device sync. Storage failures cannot stop riding; the exported README reports failed saves from the current launch. An abrupt OS termination can lose events not yet flushed.

Settings → Developer Options → Launch logs → Download all logs creates a standard CRC-checked ZIP containing one JSON per launch. It works through browser download or the native share sheet. Seven-day retention is subject to device storage availability.

## Vehicle analytics

Vehicles → personal vehicle → Vehicle performance. At least ten qualifying completed real Bluetooth rides are required. Existing original samples are analyzed on demand; no ride is rewritten and no historical telemetry is invented. Processing yields between rides.

Comparisons use sustained moving windows, reliable altitude, fresh vehicle-reported speed/charge/voltage, constant riding mode and matching speed caps. Battery charts compare flat windows in similar temperature/current bands. Hill charts compare similar charge/mode/temperature. Each bucket requires at least three independent rides and six windows; the most-supported comparable context is used. Voltage/current/power averages and contributing ride counts accompany the bars. Regeneration/charging, stale or simulated readings, interruptions and unreliable elevation are excluded. Mixed climb/descent that returns to the same altitude is excluded from flat-road comparisons. With insufficient comparable data, the UI explains why rather than drawing a misleading chart. These are observational associations; traffic, rider intent, load and weather cannot be fully controlled from the recorded data.

## Validation

Lint and TypeScript pass. All 392 application tests, including new transport timing, back-stack, settings alias, log redaction/retention/ZIP and contextual analytics checks, pass. All 38 Python workflow tests pass. Own isolated Chrome reproduced and verified direct-link Back, settings search/scroll, real public route planning, exploration off/on with no new route requests, explicit retry requests, single external-map checkbox and actual diagnostic ZIP download. ZIP CRC and cold-launch events were independently checked with Python. Native device/rendering/background verification remains outstanding. GitHub Actions builds native apps; hosted web must be deployed from the matching artifact with rollback and signaling health checks.
