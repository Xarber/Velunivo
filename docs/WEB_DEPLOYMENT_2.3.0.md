# Hosted web — 2.3.0

Deployed the successful web artifact from GitHub Actions run 38616238987, revision `328424065be22f78822ef6252d491358ad198181`. Checked the embedded revision, index, PWA manifest and stamped service worker. Activated the matching release directory under the updater lock, with rollback armed during the switch. `rollback-2.3.0-web-target.txt` preserves the prior 2.2.2 deployment.

Served HTML matches the artifact. Web/peer health and the existing service remain healthy. Fresh isolated Chrome confirmed public Settings version 2.3.0 and Developer Options commit 3284240 without JavaScript exceptions. Public WSS returned PeerServer OPEN. No signaling restart or hosted PeerServer source update was needed. Source-checkout edits and the native runtime selector were preserved.

The 392 application tests and 38 workflow tests passed before dispatch; CI prepare and web passed. Native iOS, simulator and Android jobs are still running at this check. Bluetooth hardware recovery and contextual analytics with actual device recordings remain to be validated on the scooter/device; conservative data-quality filters may leave a chart unavailable even after ten qualifying rides.
