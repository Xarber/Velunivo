# Branch and release pipeline

- `development`: no push workflows. Work in progress stays here.
- `testing`: a push runs Build and release, tagging `vMAJOR.MINOR.PATCH-testing.RUN` and publishing a GitHub prerelease. It does not update AltSource or stable screenshot galleries.
- `main`: a push runs the same validation/native/web pipeline and publishes a stable `vMAJOR.MINOR.PATCH`. Bump the app version before merging a new stable release; existing tags never move.
- Successful stable builds automatically trigger iOS/iPad gallery, Android gallery and AltSource refresh via `workflow_run`. This also works for releases created using GITHUB_TOKEN (which does not trigger a release-published workflow). Binary publication never waits for screenshots.
- Screenshot metadata commits include `[skip ci]` to avoid recursively building their own galleries. PR verification is separate; development-head PRs are excluded.
- Manual dispatch remains available for recovery and captures of existing binaries. No signing key is requested.

Hosted web deployment remains part of stable release completion; keep the existing host updater and healthy PeerServer intact.

## Build and release: one manual entry point (2.8.6)

Run **Build and release**, select the branch and publication choice:

| Choice | Result |
| --- | --- |
| `auto` | Stable on `main`, prerelease on other selected branches. Push behavior is unchanged. |
| `prerelease` | Publish a testing-tagged prerelease; do not update stable AltSource. |
| `stable` | Select `main`; validate/build/publish a stable version and update the mutable AltSource within the same workflow. Other branches are rejected with guidance to integrate first. |
| `artifacts` | Build and upload workflow artifacts only; no release tag or publication. |

Version is optional and defaults to the checked-out package version. **Development client** always means artifacts only, regardless of channel choice. Existing immutable tags are never moved. All mandatory build jobs must pass before publication. `Repair AltSource (normally automatic)` is an optional recovery tool, not a second normal release step. Native screenshot workflows follow successful stable publication and do not gate the initial binary/source release. Their stable-tag guard prevents an explicit prerelease on main from changing stable galleries.

Versions 2.8.3–2.8.5 were tagged testing prereleases; stable-source exclusion was deliberate channel separation, not an AltSource upload failure. The previous manual workflow lacked an explicit channel selector and retained a stale 2.7.2 override default. UADS did not require removing stable publication: the branch-based behavior predates the recent standards adoption. No universal branch migration is performed here.
