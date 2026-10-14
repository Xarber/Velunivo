# Hosted web deployment — 2.2.0

Deployed on 2026-10-14 from GitHub Actions run 38565385214, completed `web` artifact 11894671689, source revision `311ca1e2254bd6d581b688cea0b6362d3f13152c`.

Validated the artifact's embedded revision / version, PWA icons and stamped worker. Unpacked into `/srv/xcenter/apps/velunivo/releases/311ca1e2254bd6d581b688cea0b6362d3f13152c` and atomically updated the web `current` selector under the existing updater lock. Rollback-on-error was armed during activation. The prior 2.1.1 selector is retained in `/srv/xcenter/apps/velunivo/rollback-2.2.0-web-target.txt`.

Local served HTML exactly matches the artifact. Local and HTTPS health report both web and peer available; the service remains active. A fresh isolated Chrome session rendered Settings version 2.2.0, the configurable assumed-charge / return-location controls and Developer Options footer `Velunivo 2.2.0 · 311ca1e`, without JavaScript errors. Public WSS signaling returned PeerServer OPEN. No personal GPS or trip data was sent.

Preserved source-checkout edits, native runtime selector and healthy PeerServer process; no signaling restart or hosted-server source update was needed. Native jobs remain in progress in the same release run. GitHub Actions publishes release binaries and updates the mutable AltSource after the required build jobs complete.

The hosted-web deployment is mandatory for every future application update, as recorded in AGENTS.md and RELEASES.md. Existing installed PWA clients may use Update web app / reload to activate the new shell. The separately requested broad performance review and cleanup remain on hold for user feedback.
