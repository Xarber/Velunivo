# Scooter controls validation — 4 November 2026

Scope: M365 lock controls and activity lifecycle hooks, pairing repair entry point, BLE foreground probe/poll tolerance, ride-detection prompt and notification actions, and five translation dictionaries. No full-application audit is claimed.

Lint and TypeScript checks passed. All 519 JavaScript tests passed, including capability/stationary safety cases and stale-connection probing. The final repeat after lifecycle and stale-prompt guards also passed. All 57 Python workflow/packaging tests passed with Python 3.13. Version 2.8.0 metadata and localized release notes are included. No native builds, simulators, physical devices or scooter writes were tested locally. Headlight and SHFW timeout implementation awaits the documented physical session; unsupported writes remain absent.

See [controls behavior and hardware plan](../features-m365-controls.md). Automated success does not establish actual lock confirmation, radio recovery, background execution or Live Activity rendering.

## Publication and hosted web

Source commit `ae4d4ce5fffbd02fecdd9efd73da59e45a27f91c` was pushed to development and testing. Testing workflow [41825568883](https://github.com/Xarber/Velunivo/actions/runs/41825568883) was accepted and running; native artifacts and prerelease publication remain pending, not verified successful. Main was not promoted. The merged temporary feature branch was removed locally.

The exact 2.8.0 web export passed bundling, standalone manifest/icon checks, service-worker stamping and embedded commit verification. Hosted build metadata now reports that source and testing channel. Served HTML matched the staged artifact, public service worker matched, health reported web=true/peer=true, and a public WebSocket PeerServer handshake returned OPEN. No browser-interaction or native visual checks were performed. Deployment used the existing updater lock and atomic selector replacement without restarting the service. The actual previous target is recorded in `/srv/xcenter/apps/velunivo/rollback-2.8.0-web-target.txt`; rollback remains available. The old target differed from the prior report's selector and had no `velunivo-build.json`; it was preserved, not deleted.
