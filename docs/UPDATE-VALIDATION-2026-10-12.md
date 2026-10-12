# Update validation — 12 October 2026

The current update is not released yet. No local native compilation was performed.

## Verified in isolated browser sessions

Two fresh Chrome contexts connected to the local private PeerServer and completed:

- One-use code creation and mutual device pairing approval.
- Permanent pairing persistence and the initial automatic merge.
- Page reload followed by connection recovery.
- Unpairing with approval from the other device, clearing both persisted associations.
- Backup creation, download and deletion. The file contained no private credential envelope or pairing secret.

The original failing test used saved-place IDs containing spaces. Those IDs are invalid in the portable backup schema. Correcting the test fixture resolved export validation; a subsequent test also stopped clicking a Done button after automatic merge had refreshed the screen. Production validation was preserved.

## Automated checks

- TypeScript check passed.
- 230 JavaScript/TypeScript tests passed.
- 28 Python release/screenshot tests passed.
- Lint and TypeScript checking passed with no warnings/errors.

## Riding suggestion

The Explore screen observes its existing location stream and offers recording after sustained movement with accuracy, freshness, elapsed-time and distance checks. The suggestion includes the vehicle selector and Plan a ride. Recording requires explicit consent through an in-memory start request, rather than an externally usable URL flag.

Physical GPS validation and a fresh GitHub-built native validation remain pending. The new iPad idle-panel safe-area change also needs validation in that native build.

Sharing E-Scooter rides never request battery feedback, including old pending records. Regression coverage passed.

Push/build are on hold at the user’s request pending the full comparison in REQUEST-COMPARISON-2026-10-12.md.

## Final checks and authorization to release

The user subsequently authorized finishing checks, pushing and starting the build. Final checks: 232 JS/TS tests; 29 Python tests; lint/typecheck clean. Actual browser flows additionally passed rename propagation without duplicates, reload during an unpair request with associations retained, recovery/new consent and both-key removal, file import/merge, confirmed overwrite and Library-triggered button loading both initially and over an existing route. Map-area phone/tablet images were visually inspected after contrast, spacing and initialization corrections. Checks used isolated public QA fixtures; no user records were changed.

The 1.0.3 auxiliary release records were downloaded and consolidated into build_info.json before removing redundant assets. Original binaries/web are retained. Fresh 1.0.4 native safe-area/screenshots, Android notifications and physical diagnostic inspection remain installed-binary tests, not claims from browser tests.
