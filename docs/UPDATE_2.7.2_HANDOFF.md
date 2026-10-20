# 2.7.2 additional implementation

- Expanded recorded-ride and Memory replay controls use one bounded, fully scrollable panel. In landscape, the expanded panel uses the available safe height instead of a smaller header-derived height.
- Transit geometry uses stable 0.1-degree geographic cells across zoom levels, prioritized toward the visible center. A short settle window avoids cancelling useful requests on every gesture frame. Every request stays within the hosted proxy's accepted bounds; large views focus on at most 25 nearby cells, with existing geometry retained within the vertex budget.
- The adaptive native map accessory uses the tab controller's own public API, restoring previous accessory ownership when removed. It no longer transforms an outer navigation toolbar over the native tab rail. Tab minimization is disabled, and visibility is only changed when different.
- App plugin API 1 adds isolated executable packages, explicit manifest permissions, local persistence, cards, telemetry widgets, accent overrides, map actions and private plugin storage. Five disabled examples are bundled and published as JSON. No real plugins means no Plugins settings row unless the developer override is selected.
- Development-client build started before the remaining JS changes, per user instruction. Target UI checks are deferred until the owner installs and opens the development client.

## Hosted updater preservation

On 2026-10-20, both `/usr/local/sbin/update-services` (the timer entry) and `/usr/local/bin/update-services` on the managed host gained guards recognizing immutable CI directories named `<sha>-<content digest>`. A newer verified CI deployment is retained when origin/main is its ancestor. The 30-minute timer stays active; source checkout edits are preserved. Backups of the updater scripts are retained alongside them. A real updater invocation preserved both the CI selector and PeerServer PID; it no longer silently downgrades the testing candidate to older stable main.

The runtime selector was restored to `runtime/17519fe2-verified-ci` for the bounded transit endpoint, retaining the prior selector in `rollback-2.7.2-final-runtime.txt`. Static-only changes must not restart signaling. Inspect current selectors/PID/health before deployment; these historical identifiers are not a fresh health assertion.

## Short validation before handoff

493 JavaScript/core tests pass, including package/API validation, bounded plugin UI, sandbox escaping, source URL normalization, downloadable example consistency, transit viewport cells and the existing transfer regressions. TypeScript and Expo lint pass. These checks do not certify Duo layout, native Worker behavior, physical Bluetooth or multi-device behavior. Those checks wait for the owner's development-client handoff. No Simulator or physical-device interaction was performed during this implementation turn.
