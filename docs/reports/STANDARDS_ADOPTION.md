# Universal standards adoption — 27 October 2026

## Scope and plan

Apply the owner's standards as the maintained development baseline, inspect repository governance/release configuration, repair safe documentation/licensing gaps, preserve existing behavior and workflows, then run existing checks. Acceptance: navigable guidance, preserved third-party notice, explicit adoption gaps, no unrelated source edits committed, and evidence-based validation. No simulator or local native build: the external SSD is disconnected.

## Implemented

- AGENTS.md links the complete universal standards and documents intentional project exceptions, existing authorized channels, unsigned history, native controls, telemetry integrity and current test limits.
- Full AGPL-3.0-only LICENSE for original application code, package/lockfile root metadata and NOTICE; original Expo MIT scaffold notice preserved verbatim under docs/licenses/. Earlier published releases are not relabeled.
- Documentation index and licensing guidance; obsolete architecture overview visibly marked as historical instead of silently presented as current.
- Security reporting guidance, community conduct, EditorConfig, Git attributes and issue/PR templates. No external contact address or enabled GitHub security setting is fabricated.

## Intentional existing-project exceptions

Keep `development → testing → main`, where testing builds prereleases and main builds stable releases. This is an existing approved workflow, not the universal new-project model. No branch renaming, protection changes, repository visibility change, release dispatch or production deployment is part of this adoption. Work uses a temporary branch and integrates into development. All commits remain unsigned. Hosted application updates still require matching validated web deployment; documentation/governance changes do not replace the running app.

## Remaining gaps, ordered by impact

1. **Licensing/distribution audit:** root lockfile declarations were inventoried, not legally or recursively validated. They include MIT, ISC, Apache, BSD, MPL, LGPL, CC-BY and dual/multi-license expressions. Review actual bundled dependency/native notices, assets, fonts, maps and plugin dependencies before claiming compatibility or store readiness. Preserve corresponding source for distributed and hosted revisions.
2. **Release matrix:** release.yml currently has parallel iOS device, iOS simulator, Android APK and web jobs after shared validation. It has no independent Android AAB job. Adding AAB plus structural/architecture/signing checks and publication metadata is a separate release-pipeline implementation; do not advertise an AAB now.
3. **Android signing:** current workflow accepts release secrets but otherwise falls back to the generated development signing key. Official-store readiness and durable release-key continuity are not established by successful APK compilation. Do not replace keys automatically.
4. **Official-store variant:** extended plugin runtime exists; compile-time exclusion and separate compliant store artifact have not been established by this audit. No official-store submission is authorized here.
5. **Architecture reconciliation:** older architecture text needs a source-backed rewrite against current background tracking, routing, telemetry, storage and sync behavior. Index links current feature documents in the meantime.
6. **Application behavior audit:** developer expiry, changelog first-install/skipped-version/OTA behavior, simulation isolation, plugin resource boundaries, accessibility and all sync failure states need focused implementation-level review. Presence of documentation is not proof of compliance.
7. **Native validation:** four pre-existing UI source edits remain uncommitted and need simulator/target validation. Physical Bluetooth, battery estimates, device sync, Memories media, CallKit/Live Activities and background endurance remain physical-device checks.
8. **GitHub settings:** branch protection and private vulnerability reporting were not changed or verified. The security policy explicitly handles reporting being unavailable.

## Validation

Lint and TypeScript checks passed against the current working tree, which also contains four earlier uncommitted UI edits. Remaining test results are appended below. No app version bump, native build, release or deployment is claimed. This is a governance/configuration audit, not a full application security or performance review.

Final results: lint passed; typecheck passed; 510 JavaScript tests passed; 57 Python tests passed using installed Python 3.13. Initial invocation with Apple's Python 3.9 failed one build-metadata test because hashlib.file_digest requires Python 3.11+. This is a local interpreter mismatch, not a passing run; rerunning with the existing supported interpreter resolved it without changing application code. Screenshot/device test output uses mocked commands; no simulator was booted. git diff --check passed. Third-party root license declarations were counted but not certified. No native, browser, physical-device, production or store validation was performed in this batch.
