# 2.1.1 — first test release before performance work

## Requested changes

- The connected/connecting group's expanded controls no longer offer Join group. Leave group remains available; joining is offered again after leaving. No group connection, route replacement, media or CallKit behavior was changed.
- Reviewed language coverage, named placeholders and terminology across English, Italian, Spanish, French, German and Portuguese. Corrected more than 125 message contexts per translated language, including electrical current versus “current”, power versus energy, low speech volume versus “quiet/calm”, recorded journeys versus records/races, shared rental scooters, riding versus horse riding, charging status, arrival scheduling, learned ETA and map exploration. Composed captions were kept consistent with their individual fragments. User-authored names and stored data were not rewritten. This is an application-context review, not a claim of independent native-speaker proofreading.
- Scratch coverage now updates during movement, zoom and resize, using web move/resize events, Apple Maps region changes and MapLibre native changing-region events. Viewport updates publish the latest bounds every 120 ms so a gesture does not wait for its final event. Collection and stored tile resolution are unchanged.
- Developer Options has a second version footer at its bottom, with a seven-character commit ID. The complete SHA is injected into web, Android, iPhone and Simulator builds by Actions. Unstamped development exports explicitly show Development build rather than a fabricated revision. The ordinary Settings footer stays unchanged.
- Version 2.1.1 uses the existing Fixes & Improvements overview, with full details in the changelog submenu.

## Verification

Lint and TypeScript checks passed. Full test results are recorded below after final execution. New tests exercise the connected/disconnected group controls, throttled viewport updates and cancellation, valid/invalid build identity, and translation semantics for electrical metrics, recording and volume. Existing dictionary coverage and named-placeholder tests remain in place. The 38 Python workflow tests passed.

An isolated headless Chrome check observed real scratch GeoJSON worker updates while the mouse was still held during a drag, and after resizing the viewport. It rendered the developer footer with the stamped revision and loaded Settings in all six languages without JavaScript errors. Screenshots were inspected locally. Native gesture rendering still needs the new device build; no local native compilation or SDK download occurred. No dependencies were added.

## Second release is deliberately deferred

Do not begin the requested app-wide performance investigation, code review, cleanup or second release until the user has tested this first build and provides feedback. Keep v2.1.1 and its commit as the comparison/rollback baseline. A later fix-only performance release should use a new version (normally 2.1.2), not move or overwrite the first binary tag. The earlier 2.1.0 artifacts remain available as well.

Final results: 362 app tests passed, 38 Python workflow tests passed, production web export succeeded, and `git diff --check` was clean. No performance profiling or broad code cleanup was started.
