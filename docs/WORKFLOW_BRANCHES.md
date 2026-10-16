# Branch and release pipeline

- `development`: no push workflows. Work in progress stays here.
- `testing`: a push runs Build and release, tagging `vMAJOR.MINOR.PATCH-testing.RUN` and publishing a GitHub prerelease. It does not update AltSource or stable screenshot galleries.
- `main`: a push runs the same validation/native/web pipeline and publishes a stable `vMAJOR.MINOR.PATCH`. Bump the app version before merging a new stable release; existing tags never move.
- Successful stable builds automatically trigger iOS/iPad gallery, Android gallery and AltSource refresh via `workflow_run`. This also works for releases created using GITHUB_TOKEN (which does not trigger a release-published workflow). Binary publication never waits for screenshots.
- Screenshot metadata commits include `[skip ci]` to avoid recursively building their own galleries. PR verification is separate; development-head PRs are excluded.
- Manual dispatch remains available for recovery and captures of existing binaries. No signing key is requested.

Hosted web deployment remains part of stable release completion; keep the existing host updater and healthy PeerServer intact.
