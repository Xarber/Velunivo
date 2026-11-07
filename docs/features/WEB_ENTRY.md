# Web home and app entry — 2.8.5

The public web home is `/`. An ordinary first visit shows the product introduction there, with the browser URL unchanged. Choosing Open web app remembers `velunivo-web-opened-v1=true` in browser-local storage and displays the application. Later ordinary visits go straight to the app. This preference is not a synced setting or backup record. If browser storage is blocked, entering still works for the current session; persistence across restarts cannot be guaranteed.

The web Velunivo logo is an accessible About Velunivo button. It reopens the introduction over the existing app, which remains mounted and inert behind it; returning does not discard application state or unmount ongoing services. It does not introduce a new router-history entry. Native `WebEntryGate.tsx` passes children straight through and native `Brand` keeps its original non-interactive View: iOS/Android never show this page or subscribe to its DOM events.

## Modules and boundaries

- `core/webEntry.ts`: ordinary-root/deep-link policy and strict message-origin/source validation.
- `components/WebEntryGate.web.tsx`: browser-only entry state, persistent choice and same-origin landing frame. Children are not mounted on the initial landing screen, so app providers and automatic location/Bluetooth work do not start merely to display the introduction. Once opened, app services stay mounted when the introduction is revisited.
- `public/about.html`, `about.css`, `about-entry.js`: reusable standalone introduction and small open-app bridge. `/about.html` remains a compatibility URL, not the primary homepage. Canonical URL is `/`. An embedded open request is accepted only from that exact iframe window and the current origin; no user records or credentials pass through messages. Direct-link fallback uses `/?openApp=1` and the host removes that reserved parameter after entry.
- `/share/*`, `/offline`, `/settings` and root navigation/screenshot parameters bypass the introduction. Ordinary source/UTM marketing parameters do not. `/?landing=1` explicitly requests it even after prior entry.
- Existing app/deep-link URLs, PWA identity, routing and separate marketing/app cache keys stay intact. The small entry script participates in cache versioning/precache. No server/PeerServer runtime change or new hosting service is needed.

## Validation

Lint, type checking and all 557 JavaScript tests passed. Added tests for first/repeat visits, explicit entry/reopen URLs, deep-link bypass, and rejecting foreign-frame/wrong-origin/malformed open requests. Existing offline cache isolation tests passed.

Integrated browser against a production web export: first root visit visibly showed the introduction; Open web app displayed Your ride while the URL stayed `/`; reload skipped the introduction; the web logo reopened it; a second open and reload returned to the app. Existing What's New was dismissed before testing the logo (it intentionally blocks background controls). No console errors were reported. A read-only browser diagnostic could not access localStorage directly in its isolated evaluation scope; persistence was verified through actual reload behavior instead. Browser test did not grant location, Bluetooth, camera or microphone permissions.

Native pass-through separation is reviewed in source and TypeScript; no simulator or physical-device visual test was performed. This change does not claim native runtime validation. Final deployment and build status are recorded below.
