# Automatic ride UI, ride return controls and publication — 2.8.6

## Scope and causes

- User physically observed 2.8.3 start a Bluetooth ride in the background. That is user-reported evidence, not an agent physical test. Root automatic recording previously exposed only its own home banner and set the ride destination to `/`.
- Active-ride tab navigation hides the tabs by design. The return control was restricted to `/settings`, trapping vehicle subpages.
- Every Velunivo activity uses the guarded Swift renderer. Its model/layout did not implement the `ridingPrompt` props, so the existing JS prompt renderer was bypassed. Prompt creation also occurred only after background motion, while ordinary local ActivityKit requests require foreground execution.
- Confirmed actual published tag commits through GitHub: 2.8.3 testing.128 = `a4d6905b67f9363d3bc83f4323c303dc6b15927d`; 2.8.5 testing.130 = `c344d9921a9c1d466417bca9fc09e81ac77b7b0f`. Bluetooth integration, automatic-recorder policy and automatic-wake service have no source differences between those commits. Dependency changes are root app versions only. Web entry isolation/visual changes are not proof that physical Bluetooth behavior is identical; new device logs are needed to investigate any observed transport problem. No protocol, authentication, reconnect timing or pairing format is changed in this update.

## Implementation

Automatic recording retains one root-owned GPS/storage/control session. Its ephemeral `automaticRecordingView` adapter lets the ordinary RecordTrip dashboard display the same controller, live path/metrics/error/finish/bookmark operations; the local recorder and local location watcher stay inactive. Foreground/resume navigates to that dashboard once, without repeatedly redirecting while browsing vehicle/settings pages. The old banner is removed. UI unmounting does not release the root session's ride lock. Live recording activity includes existing battery/group/viewer extras.

Ride return chrome appears on every non-activity tab path while a ride is active, including vehicle list/details/Bluetooth/control pages, and targets the stored navigation or recording route. Root-owned automatic rides set that route correctly.

The native prompt has a navigation arrow, Velunivo title, Are you riding?, accent-filled Start recording and plain-accent Find destination actions. It arms in the foreground when an opted-in real scooter is connected and updates the existing instance in background. An automatic recording can promote that already-created activity into the recording layout without asking ActivityKit for a second background activity. Cleanup excludes promoted instances; ending the ride ends its own activity. A foreground retry recovers a previously rejected local activity request. Developer Options adds an isolated prompt layout test; its source remains the test factory, so preview actions cannot control a real scooter.

A lock/unlock icon appears only for a real supported connection with a recently measured lock state, and is disabled with stale/moving/missing speed data. Native interaction delivery rechecks the exact vehicle, capability and safe stationary state before the existing verified bridge lock operation. Public deep links cannot invoke it. Record/search intents explicitly foreground the app; arbitrary deep links do not auto-start recording.

## Platform limits and security

No APNs credentials/backend added. If iOS wakes a force-quit app with no existing activity, starting a new ordinary local Live Activity in arbitrary background execution remains unsupported; the local notification fallback is retained. Foreground-armed/promoted activities can update during permitted background execution. Disconnected, unsupported, simulated or stale telemetry never enables a scooter write. Existing non-prompt navigation/shared/recording Swift layouts stay in their original branches.

References: Apple [Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities) and installed Expo Widgets 57.0.23 / Expo SDK 57 integration. Swift/Apple design skills consulted. No new dependency, SDK installation, local native build or simulator used.

## Release controls

The primary workflow now exposes Auto / Prerelease / Stable / Artifacts only, with an optional version override and existing development-build switch. Stable remains on main and updates AltSource in the same publish job. Replaced the stale hardcoded 2.7.2 input. The redundant normal AltSource follow-up workflow is now manual repair only; stable galleries continue automatically with a stable-tag guard. See [workflow instructions](../WORKFLOW_BRANCHES.md).

## Validation

Validation results and publication handoff follow below. Physical iPhone background/foreground continuity, actual widget buttons and scooter lock commands require device testing; no physical success is claimed from source checks or remote compilation.

Local final checks: lint and TypeScript passed; all 563 JavaScript tests and 59 Python 3.13 tooling/workflow tests passed. Swift syntax parsing passed (not iOS SDK semantic compilation). Tests cover return-button targets for navigation/recording across settings and every vehicle subpage; prompt model capability/freshness/stationary rules; foreground-only initial creation and background reuse; promotion into a recording activity without another request; protection of the promoted instance from idle-prompt cleanup; existing motion detector preservation; isolated developer preview actions; stable/prerelease/artifact/development publication modes and stable-branch enforcement. Unchanged prompt props are throttled to 15-second refreshes to avoid per-packet widget work; state changes update immediately.

No physical scooter commands, pairing changes or device settings were performed. No new simulator/local native build. Actual widget appearance, App Intent foreground delivery and automatic dashboard resume must be checked on a physical installation; compilation cannot establish those results.
