# Paused at user request — 18 October 2026

User asked to clean up, push and stop because usage is nearly exhausted. Do not infer that pending target validation or hosting deployment is complete.

## First next-session fix
The user supplied a native landscape navigation screenshot showing MapKit's built-in compass floating in the middle of the map, overlapping a rider pin. Fix its placement/hide it in favor of the app's orientation control; inspect the screenshot in the conversation. Do this on next start, not during this pause.

## Current work
2.6.1 implements map arrows/pins/badges, camera resize inputs, recording return owner, battery history/learned disconnected estimates, Library Memories/map previews, sample data/clustered ghost riders, and richer historical telemetry quality/comparisons/advice. See CHANGES_2.6.1.md and WORKLIST_2.6.1.md for scope and incomplete checks.

- 470 app tests, lint and typecheck passed after native lifecycle/layout edits.
- 52 workflow tests pass after screenshot changes (rerun result in /tmp/velunivo261-final-workflow-tests.txt).
- Isolated Chromium/WebKit map and analytics checks passed before final screenshot-only edits. This does not prove macOS Safari's OS location delivery.
- CI build 39107928241 targets 1223437 on testing; its new UIKit toolbar requires the CI compiler and target verification. Local Swift parsing passed, no local native compilation or SDK download performed.
- Existing user Duo UUID 2C890A13-802C-4E34-BAE3-3530022483B1 uses active display 3; default display 1 is inactive/black. Device Hub Rotate Right changes the actual active orientation; devicectl can target its inactive display. User explicitly permits disposable use, no backup.
- On native candidate e89d799: arrow/chevron visible; five randomly clustered ghost pins retain avatars/initials; halo faces centered; badges stacked; portrait accessory centered and collapsed sheet bottom-anchored.
- Actual recording→Settings test exposed Store's cleanup resetting the return target. Fixed by retaining lockVehicle as the single writer, removing its duplicate state effect. Retest with a final CI artifact.
- Unfolded Duo height669 was excluded by height<600. Fixed landscape gate. Retest camera center/speed placement after real rotation.
- Duo's vertical tab/toolbar rail differs from iPad Sidebar. Added actual UIBarButtonItem toolbar integration for a visible vertical native tab bar, preserving/restoring prior items/visibility. Not yet target-verified. Do not claim the rail works until tested.

## Screenshot status
- Fresh iPhone17Pro startup capture succeeded locally; actual app stayed alive and OCR passed.
- Fresh iPadPro11(M5) installed/launched, but locked landscape app content was sideways in a portrait framebuffer (1668×2420); rejected correctly. Locking interface orientation alone is insufficient.
- Latest script now also requests physical device landscape once after launch, even for locked QA galleries. Retry was interrupted during startup settling at user's stop request, so this change remains unverified.
- Latest capture refreshes the same public Milan fixture before screenshots, avoiding a stale one-shot GPS banner.
- No extra gallery published because both startup families have not yet passed. No rejected/partial images staged into onboarding.
- Added automatic iOS welcome-preview staging with complete/fresh/current-version checks, tests and serialized Android/iOS preview publication. Source gallery still iPhone before landscape iPad, screenshots excluded from README and binary assets.
- CI app download in ignored artifacts used e89d799; obtain the final ios-simulator artifact before final validation. Temporary native app/download and isolated web export removed for space after pause; screenshots/logs retained as evidence.
- /tmp/velunivo261-native-qa.py is the old fresh-device gallery plan; use existing Duo for regression testing. Only one Simulator booted. Do not run any script that backs up the Duo.

## Release and hosted web
Pushed to main at user's explicit stop/push request, triggering stable build automatically. Do not wait/run long builds while paused. Next start inspect latest Actions results before further code changes.
Hosted web remains validated 2.6.0, commit358959a. Matching 2.6.1 web deployment is PENDING. Deploy exact successful final CI web artifact with rollback, public version/commit, health and PeerServer WSS checks. Do not restart healthy signaling for static changes. Consult WEB_DEPLOYMENT_2.1.1.md and verify live paths.
SSH root@100.94.102.3 works; live 2.6.0 release path /srv/xcenter/apps/velunivo/releases/ci/358959ab7f6015a7fa051a3a094770a447941937. /tmp/velunivo260-activate.py is prior immutable-staging/atomic-selector script; inspect and change backup names before reuse.
