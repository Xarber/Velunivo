# Hosted web — 2.2.1

GitHub Actions run 38582879812 completed successfully, including native jobs and publication. Deployed its web artifact, revision `bd3248a73f05e1e94c13c5d425ee03518ba2d056`, to the matching release directory on XCenter under the updater lock. Atomically switched the static selector, with rollback armed during activation. The prior target is retained in `rollback-2.2.1-web-target.txt`.

Served HTML matches the artifact; web/peer health and the service remain healthy. A fresh isolated headless Chrome rendered version 2.2.1 and developer revision bd3248a without page errors. Public WSS returned PeerServer OPEN. No signaling restart or source-checkout modification was needed. This is the functional baseline for comparison with the performance follow-up.
