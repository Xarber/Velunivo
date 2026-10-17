# Velunivo 2.5.1 testing update

## Scope and rewards

Rewards live in Profile → Achievements & challenges → Explorer rewards. Theme, badge, avatar, navigation arrow, location-pin and scratch-outline presets are grouped there. Three bundled JPEG avatars work through the existing profile/photo protocol. Badge thresholds are 1,000/4,000/12,000 XP; arrows 2,000/6,000; themes 3,000/7,000/15,000/25,000. Avatar thresholds are 250/750/1,500; pin variants 1,500/5,000; crisp scratch outlines 4,500. A bonus Best exploration day insight unlocks at 150 XP; existing statistics remain free. These are lifetime-XP unlock thresholds, not a spendable currency.

Navigation arrow paths are now visibly distinct. Native position markers remount on cosmetic changes so map snapshots refresh. Pin presets affect navigation/current-position markers and group pins on native/web. Scratch styling changes rendered outlines only; H3 discovery cells never change. Existing selected cosmetics and earned XP are not reset.

Neighborhood XP scales linearly from 100 to 500 over 0–10 km (rounded to 5 XP); 10 km awards 500. Actual generated distance is persisted with the challenge; older challenges retain their previously promised 250 XP. Daily tile XP scales with the tile target. No old completion awards are rewritten.

## Adaptive UI

The main Library uses system-managed native safe areas on supported native tabs, all horizontal edges on other devices, and narrower previews stay scrollable instead of being squeezed. Automatic tab content insets are disabled there to avoid double application. iOS map actions use actual SwiftUI buttons and system glass rather than an imitation tab selector; other platforms retain their existing implementation. Their right edge aligns with Search.

The native appearance module measures the live window safe area and actual top tab-bar frame. Wide iPad headers share its row; compact windows place the header below it. Phones/folded layouts use current safe-area insets without fixed iPad spacing. Metrics refresh after dimensions/insets change. This implementation needs the new binary; it has not been visually verified on the user's Duo/iPad in this low-usage pass.

## Live Activities and developer history

The tester exposes three layouts: navigation, recording and shared trip. Regroup, approval, charging and stale battery are independent toggles. The native Swift renderer now includes join-request text and a bottom action row, matching the JS layout. Review request opens the app; it does not silently admit a rider from a locked screen. Existing layout geometry is preserved.

Every developer history entry has its release tag commit and its own commit ID. Authored commit descriptions are retained; commits without a body receive a factual summary from their subject and changed file paths. Historical version numbers are unchanged. CI regenerates the metadata from full history for the exact built revision.

## Development clients

Actions → Build and release → Run workflow: choose main, testing or development and enable Development client. This selects Debug native configurations and the Expo development launcher. It produces workflow artifacts only, does not create release tags, publish releases, or update AltSource. No EAS submission is involved.

Install the relevant development artifact, then run `npm start -- --dev-client` from the desired checkout. Both devices must reach the Metro server. Compatible JS/TS edits can reload without compiling again. Changes to native modules, native configuration or SDK dependencies still need a new development binary. These unsigned iOS builds still need the user's existing installation/signing method. Do not expose Metro publicly to untrusted networks.

2.5.1 is prepared for publication as a testing prerelease; gallery workflows and stable AltSource are deliberately not triggered. No screenshot work, SDK downloads, local native build or extra simulator session was started.

## Cleanup and validation

Removed 573,021,601 bytes of task-created temporary build/capture artifacts and a broken iOS 18.6 runtime symlink. Xcode DerivedData, simulator temporary-deletion directory and personalization cache were already empty. Installed Xcode/SDKs, user iPhone Duo and iPhone 18 Pro devices, archives, user apps and user files were preserved. No claim that all remaining disk usage is disposable.

Short checks: TypeScript, Expo lint, 432 application tests, 49 Python tooling tests, workflow YAML/shell syntax, development Expo config and Swift syntax parsing (no native compilation).

Native follow-up required: device syncing, Bluetooth charging/battery, Memories capture/playback, and visual Duo/iPad layout checks. These are not claimed hardware-verified.
