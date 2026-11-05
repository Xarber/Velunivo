# Standards / Developer Ideas 2.8.1 — 5 November 2026

## Scope and implementation

Applied new standard 35 with a modular offline Ideas notebook in the existing developer section, portable reviewed JSON and Markdown exports, stable identifiers, retained revisions/deletion, serialized storage, explicit verification references, repository collection and local import/review CLI. Added six-language labels, changelog idea IDs and documentation/AGENTS retrieval instructions. Existing application adapters and release channels are retained. No ScooterHacking code, protocol writes, on-device private ideas, third-party scooter images, signing identities or workflow migrations are included.

`docs/IDEAS.json` records only this already-public authorized implementation task; no private app collection was retrieved. Imported private ideas are not automatically committed, synchronized to GitHub or bundled. The other chat's Bluetooth work is excluded in an isolated worktree.

## Validation

Lint/typecheck and 533 JavaScript tests passed before the final additional status case; 57 Python workflow tests passed using existing Python 3.13. Tests cover schema boundaries, merge preservation/idempotence, statuses, corrupt persistence and failed writes. Final results and browser evidence follow below. No simulator, physical iPhone/iPad/Android, native keyboard, system picker or native share-sheet test has been performed. Installed existing adapters: DocumentPicker 57.0.3, FileSystem 57.0.7 and Sharing 57.0.22; versioned Expo 57 documentation was checked. Sharing's current docs recommend a newer patch; no dependency upgrade or new native API was introduced.

## Existing standards gaps

This is not a whole-application compliance certification. The existing adoption report still records dependency/asset licensing review, Android AAB/long-term signing verification, store-compliant plugin variants, full native/device behavior and architecture reconciliation as open areas. Existing project-specific `development → testing → main` remains authorized; no branch migration or new store publication is performed. Private automatic idea retrieval is unavailable without an authorized export/private synchronization mechanism.

Final software validation: lint and TypeScript passed. All 534 JavaScript tests passed with test concurrency limited to two; all 57 Python tests passed. A prior full-parallel run failed the pre-existing native-notification timing fixture (100 ms timeout) while bundling was running; the five-test Bluetooth suite passed independently, and the entire lower-concurrency run passed. Bluetooth production code/tests were not changed to hide this failure.

Browser: tested the production web export in the integrated browser at localhost:8087. Enabled developer access through the real triple-tap flow, created and saved a disposable idea, reloaded and observed persistence, edited description/status, inspected preserved history, downloaded JSON, imported that file through the real picker and review screen without duplicates, and soft-deleted/restored the record. No browser errors were reported. Screenshot evidence saved locally as `/tmp/velunivo-ideas-browser.png`. These were disposable local records; no private notes were accessed or published. Browser success does not establish native system UI behavior.

## Git, build and deployment

Feature source `669aa12` and verification reference `1c96a04` were integrated into development and testing. [Testing workflow 42010299662](https://github.com/Xarber/Velunivo/actions/runs/42010299662) was submitted and running when inspected; native artifacts and prerelease publication were not verified complete. No stable promotion or new store distribution occurred.

The final web export was regenerated with exact source `1c96a04546263dd5c55ceb66918d12c77a482e6e` / 2.8.1. Embedded commit, standalone manifest, icon files and stamped service worker passed inspection. Deployment used the existing lock and an atomic selector; public metadata, staged/served HTML hashes, service worker bytes, health and a public WSS PeerServer OPEN handshake passed. No service restart. Previous selector `/srv/xcenter/apps/velunivo/releases/a6039810a449ca5b983c9582adc56b4a96692e8e` is preserved in `rollback-2.8.1-web-target.txt` (the prior testing selector had changed before deployment). The local browser evidence is preserved at `/Users/xarber/Documents/ChatGPT/Velunivo/outputs/ideas-2.8.1-browser.png`; it shows the candidate export, not a native screenshot.

Temporary worktree/branch are removed after fast-forward integration; the active Bluetooth branch and its uncommitted files are preserved. No dependencies, SDKs or native builds were installed locally. The temporary preview server is stopped after verification.
