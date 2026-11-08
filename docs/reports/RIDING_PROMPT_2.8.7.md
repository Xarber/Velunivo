# Compact riding prompt — 2.8.7

## Scope

User-reported 2.8.6 Live Activity functionality works; the connected lock control made the title row taller and pushed actions outside the expanded Dynamic Island. This update changes only the riding prompt presentation and its vehicle-icon props. Normal navigation, trip recording and shared-trip layouts, Bluetooth commands and activity lifecycle policies are preserved.

## Changes

- Lock/unlock shares one horizontal action row with Start recording and Find destination. The title no longer allocates a separate 32-point-tall lock control. Lock state, stationary checks, stale-state disabling and event source validation remain unchanged.
- Start recording has a play symbol. Minimal native SF Symbols show a scooter or bicycle according to the paired vehicle category; unknown/legacy categories retain the scooter fallback. The JS fallback presentation uses the same icon props.
- Text groups have 10 points of vertical spacing instead of 8. Compact action typography, single-line labels and scaling preserve available width with localized labels.
- Version and translated release notes updated to 2.8.7. No dependencies, permissions, protocol writes or unrelated UI changed.

## Validation

Lint and TypeScript passed. Swift parser and guarded widget patch passed. JavaScript suite: 564 tests passed; Python suite: 59 tests passed. Regression tests cover scooter/bicycle icon selection, unchanged navigation symbol contracts, lock placement after the other actions, intent source isolation and lock safety. The initial suite identified an obsolete source assertion for the old stale-disable expression; it now verifies the action row’s inherited stale disabling.

No simulator or physical-device visual test was performed: the SSD/simulator restriction remains in place. Swift syntax parsing is not native compilation or proof of Dynamic Island fit. Native builds and actual connected prompt appearance remain separate release/device validation gates.

## Release

Development → testing → main promotion and the established stable workflow are used. The workflow publishes binaries and updates the approved AltSource only after mandatory builds succeed. Hosted web receives the matching version/commit with rollback retained; publication results are recorded after submission.
