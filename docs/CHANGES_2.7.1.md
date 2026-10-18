# 2.7.1 — Simulator and browser validation follow-up

- Uses MapLibre's marker opacity API rather than direct CSS, which the map library overwrites on camera updates. An isolated GPS-silence test now verifies the retained local pin fades from 1 to .45 after 65 seconds without another GPS reading.
- Includes the 2.7.0 feature set and its design/motion audit. The unpublished v2.7.0 tag remains pinned; it is not moved to reuse a version for this fix.
- Short validation: 479 application tests, 53 Python workflow tests, lint and TypeScript checks passed before this version-only update. Chromium/WebKit layout and synchronized synthetic-media playback passed; final native Simulator and release status are recorded separately.

## User-requested stop checkpoint
- Native candidate 2.7.0 on the existing Duo showed the customized chevron without a rectangular shadow, no duplicate MapKit compass, and full-screen safe-area directions. Unfolding moved ride controls to the horizontal layout.
- Current JavaScript was also exercised over the compiled candidate (local JavaScript bundle only, no native compilation/SDK download). The horizontal floating controls regain their glass capsule.
- **Unresolved for the next build:** UITabAccessory does not occupy the Duo's vertical toolbar slot; it appears at the bottom and clips the vertical stack. Do not call toolbar placement fixed. Inspect actual toolbar integration and avoid overlapping native tabs.
- **Next build:** apply all findings in DESIGN_MOTION_REVIEW_2.7.0.md, as explicitly requested at this checkpoint. Fresh gallery completion, Dynamic Island background testing, and exact final-build native checks remain unfinished. Do not claim them validated.
- User requested immediate stop/push/build due to low usage. The hosted 2.7.1 deployment has not yet been completed; verify and deploy the matching CI artifact when work resumes.
