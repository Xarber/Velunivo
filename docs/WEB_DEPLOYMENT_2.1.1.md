# Hosted web deployment — 2.1.1

On 2026-10-13, deployed the completed web artifact from Actions run 38457349348, source revision `d2ff2a19da559cc73d8a3757809655d995e17bcd`, to https://velunivo.xcenter.it. Native jobs in that same release run were still building at the time of deployment; no additional native build or local compilation was started.

Verified the artifact's actual revision, version, PWA manifest and stamped service worker before deploying. Unpacked it into `/srv/xcenter/apps/velunivo/releases/d2ff2a19da559cc73d8a3757809655d995e17bcd`, then changed only the web `current` selector under the existing updater lock. Activation included rollback on failed checks. The previous 2.1.0 target was retained in `/srv/xcenter/apps/velunivo/rollback-2.1.1-web-target.txt`. Source checkout edits, runtime selector and PeerServer process were preserved.

Checks passed: local served HTML exactly matched the artifact; local and HTTPS health reported web and peer true; systemd remained active. A fresh isolated Chrome session rendered Settings version 2.1.1, Battery planning return-location options and Developer Options footer `Velunivo 2.1.1 · d2ff2a1`, with no JavaScript errors. A real public WSS PeerServer handshake returned OPEN. No personal location or trip data was sent.

Previously installed/open PWA clients can reload or use Update web app to activate the new shell. Performance review, code cleanup and the second release remain deferred until the user tests 2.1.1.
