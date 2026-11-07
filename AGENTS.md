# Velunivo agent entry point

Read [the universal application standards](docs/standards/UNIVERSAL_APPLICATION_STANDARDS.md), [documentation index](docs/INDEX.md), and [standards adoption report](docs/reports/STANDARDS_ADOPTION.md) before development. Explicit task instructions and established project decisions specialize these defaults. Do not silently migrate workflows or claim checklist compliance without evidence.

## Project-specific decisions

- Original Velunivo code is AGPL-3.0-only. Preserve third-party licenses and attribution; the Expo scaffold notice is retained under docs/licenses/.
- Existing progression is `development → testing → main`: development has no automatic push builds, testing publishes prereleases, main publishes stable releases. This intentionally predates the universal default. Integrate ordinary completed changes into development; do not push directly to stable. Migrating to `testing → beta → main` requires approval.
- Existing authorized channels are GitHub releases, the mutable 1.0 AltSource, Obtainium-compatible APK assets, and https://velunivo.xcenter.it. New stores or public destinations require authorization.
- Do not mix pre-existing uncommitted changes into another task's commits. No simulator access while the user's SSD is disconnected; no local native build or SDK download without explicit authorization.
- Preserve native SwiftUI controls and native tab navigation. Search is first when grouped. Test avatars/initials and custom markers separately on MapKit, MapLibre and web.
- Distinguish measured, derived, estimated, stale and simulated telemetry. Invalid/missing samples must not erase valid cached readings. Simulations must not affect real rewards, calibration or synchronization.
- Native/physical evidence must be reported separately. Physical Bluetooth, synchronization, Memories media, CallKit and background endurance remain target-device checks.

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Builds and releases

Use the GitHub Actions workflows and docs/RELEASES.md. Do not submit to EAS. Native builds prefer installed Xcode beta/RC (falling back to installed stable Xcode when unavailable) and Android SDK Manager's latest stable SDK on runners. Do not download local SDKs unless the user explicitly authorizes it.

All commits and tags must remain unsigned, including when global Git signing is enabled. Use --no-gpg-sign for commits; leave the user's physical security key alone. Use descriptive conventional commits. Document changes and validation in Markdown. Keep the mutable AltSource in the special 1.0 release; binaries use v-prefixed semantic version tags. Do not publish the ignored private example GPX.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding native code, obtain a development build using the GitHub Actions manual development-build option. Do not run a local native build or submit to EAS under the current project rules.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Hosted web updates

For every Velunivo application update, also deploy the matching validated web build to https://velunivo.xcenter.it. Updating GitHub/native artifacts alone does not complete a release. Preserve rollback and verify the public version/commit, web health and PeerServer handshake. Prefer changing static release selectors without restarting healthy signaling. See docs/WEB_DEPLOYMENT_2.1.1.md for the current deployment procedure; inspect the live host before applying it.

## Developer Ideas — section 35

At the start of each substantial session, read `docs/IDEAS.json` and `docs/features/DEVELOPER_IDEAS.md`. Run `./node_modules/.bin/tsx scripts/ideas.ts list` for pending/approved/deferred counts. Identify new or relevant ideas, compare against source and release metadata, and ask whether to implement selected ideas now or later; do not automatically implement unrelated ideas or repeatedly interrupt a declined decision. Explicit task authorization remains sufficient for matching work.

Private on-device ideas are not accessible automatically. Ask for the one-action Ideas JSON export only when needed. Preview it with `tsx scripts/ideas.ts import FILE`; review privacy before `--apply` or committing anything. Conflicting versions require explicit `--accept=ID` to replace local content; both histories are retained. Never publish private ideas through this public repository or release artifacts without explicit authorization. Preserve deferred/unselected entries, IDs, source timestamps and histories. Track verified implementation with version, commit and verification time; include idea IDs in structured release metadata and commit bodies. Never mark started or untested work Implemented.


## UADS section 36 — infrastructure and design

See the [current adoption and validation report](docs/reports/UADS_36_2026-11-07.md).

- Read the complete repository UADS snapshot, including section 36; the owner’s newer explicit instructions govern if the local snapshot is older. Existing branches and the project-specific unsigned-commit decision above remain intentional exceptions. Do not probe the physical signing key or rewrite history without authorization.
- Reuse this repository. X-Center is the established hosting default; preserve healthy web/PeerServer services and deploy static changes with rollback. Do not provision another host or new infrastructure to satisfy a checklist.
- The functional PWA stays at `/`; the separate public product introduction lives at `/about.html`. Preserve app/share/deep-link URLs. Never cache marketing HTML under the PWA shell key. Screenshots on the landing page are explicitly labeled web/simulated previews.
- Before meaningful UI changes, read applicable installed `apple-design`, `animate-expo`, `review-animations`, web motion or accessibility skills. Apply the frequency/purpose gate: platform tab/keyboard behavior stays native; occasional sheets and feedback may animate. Respect Reduced Motion, transparency/contrast preferences, safe areas and text scaling. Do not animate merely to add motion.
- Use meaningful labeled icons, grouped supporting text and accessible contrast. Keep safety/consent information visible and dedicated information pages readable without unnecessary info buttons. Validate the actual affected targets; unavailable native devices remain an explicit validation gap.
