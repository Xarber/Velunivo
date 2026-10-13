# Web deployment — 2.1.0

Deployed the validated `web` artifact from successful GitHub Actions run 38441765890, commit `7022ee84fcddc9595d3c0a735c029b607d2a5c5c`, to https://velunivo.xcenter.it on 2026-10-13. No native or web compilation was needed during deployment.

The existing server checkout had an uncommitted change in its generated group runtime, causing the automatic updater to refuse deployment. It was preserved. The artifact was unpacked into the immutable release directory `/srv/xcenter/apps/velunivo/releases/7022ee84fcddc9595d3c0a735c029b607d2a5c5c`. Under the updater's deployment lock, the web `current` symlink was switched atomically. The previous target is recorded in `/srv/xcenter/apps/velunivo/rollback-2.1.0-web-target.txt`; activation had an error-triggered rollback handler.

The server runtime symlink and running PeerServer process were retained, avoiding interruption of existing signaling sessions. Automatic source-based deployments still require resolving the preserved generated-file difference; this deployment does not discard it or alter other application updaters.

Checks passed: exact served HTML matched the candidate; deployed JavaScript includes version 2.1.0 and the new return-location features; PWA manifest and stamped worker were present; local and public HTTPS health returned web and peer true; systemd stayed active. A fresh isolated Chrome session rendered the public Settings version and Battery planning return-location options without JavaScript errors. A real public WSS PeerServer handshake returned OPEN. These checks do not send private ride data or establish physical-device Bluetooth behavior.

The same artifact is available as a local static preview at http://127.0.0.1:8083/. Reload the page or use the PWA update action if a previously installed shell remains open.
