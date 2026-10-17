# 2.5.2 testing update

## Map layout and native rewards

Reverted the custom wide-iPad header alignment. The logo/search header now always clears both the current safe-area top and the measured native top tab strip, including after window resizing. Safe areas take precedence over placing the header in the tab strip's row. Existing web/non-glass layouts remain unchanged.

Duo's vertical native tab strip is detected separately. When present, an owned SwiftUI hosting view places the map actions beneath its controls; it is removed when the map loses focus or the native sidebar disappears. Other devices retain the established floating controls. This needs visual validation on Duo; Swift parsing is not a simulator or physical-device test.

Native navigation arrows now use three distinct bundled transparent bitmap assets, with marker redraw on image load. This avoids relying solely on SVG map snapshots. All three remain selectable through the existing rewards menu.

## Rewards

Up to three distinct profile badges can be selected. Legacy single-badge preferences migrate without losing selection; the multi-selection is stored as a primitive string so existing timestamped settings synchronization supports it. Badges overlap outside the clipped photo/video, including group maps, riders lists and profile previews, with shadows. All achievements awards a gold crown; level 50 awards a gold star. Milestones appear automatically and take priority within the three-badge limit.

Developer Options → Reward previews has a temporary local unlock. It resets on cold launch, and selections remain in memory rather than updating saved preferences, XP or outgoing group profiles. Themes and profile avatars are excluded. Arrows, pins, scratch outlines and badges have previews. Disabling the switch discards test selections immediately.

## Live Activities

Removed the permanent Open ride action. Recording no longer has a redundant distance/dash header. Statistics and small badges share a row. Join approval is a single name/request row with check and cross on iOS 17+, bound to the exact room and pending request. Stale or unrelated action events are ignored. On older iOS the row links into the app to review the request. Regroup warnings remain compact. Native action delivery still depends on the installation's widget interaction support; this does not establish compatibility with every container/sideload method.

## Browser storage

Web AsyncStorage now resolves to an IndexedDB adapter, with an atomic first-open migration of legacy localStorage values. Legacy entries are removed only after a successful migration transaction. Existing IndexedDB values take priority. Large backups no longer compete with localStorage's approximately 5 MB ceiling. Native AsyncStorage is unchanged. Existing Memories media retains its separate IndexedDB database.

Settings → Storage shows the browser's actual usage/quota when exposed by the browser, an explanation of the existing 64 MB import-file limit, and an optional persistent-storage request. Persistence is browser-controlled, not guaranteed. Cross-tab storage notifications are preserved. Quota failure reports an error instead of silently dropping data.

## Progress feedback

Loading buttons now use the same background-fill treatment as scratch recovery. Unknown duration uses an indeterminate sweep; paired-device and one-time transfers show their actual transfer progress. The progress indicator is labelled generically instead of as a download. It does not imply an elapsed-time estimate or fabricate percentages.

## Validation

See the final validation results below before release. No native compilation, SDK download, simulator boot or interaction with the user's browser was performed in this pass. Sync, charging/battery telemetry and Memories still need the user's native tests. Duo sidebar geometry and native reward snapshots also need device validation.

### Short checks completed

- TypeScript and Expo lint passed.
- 436 JavaScript/TypeScript regression tests passed, including the new reward allowlist, reset, milestone, badge migration and approval-target cases.
- 49 Python workflow/capture/release tests passed using the bundled current Python. The macOS system Python is too old for `hashlib.file_digest`; that environment failure was rerun with the compatible interpreter.
- Real isolated Chromium IndexedDB checks passed: legacy migration, an 8 MB value, persistence after reload, atomic failed-batch rollback, multi-key operations and cross-tab notification/readback.
- Swift syntax parsing passed for the appearance module and ActivityKit views; this is not native compilation or visual/device validation.
