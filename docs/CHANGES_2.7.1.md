# 2.7.1 — Simulator and browser validation follow-up

- Uses MapLibre's marker opacity API rather than direct CSS, which the map library overwrites on camera updates. An isolated GPS-silence test now verifies the retained local pin fades from 1 to .45 after 65 seconds without another GPS reading.
- Includes the 2.7.0 feature set and its design/motion audit. The unpublished v2.7.0 tag remains pinned; it is not moved to reuse a version for this fix.
- Short validation: 479 application tests, 53 Python workflow tests, lint and TypeScript checks passed before this version-only update. Chromium/WebKit layout and synchronized synthetic-media playback passed; final native Simulator and release status are recorded separately.
