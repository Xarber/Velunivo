# Universal Application Development Standards

These instructions apply to **every application, repository, feature, modification, build, deployment, and release** unless explicitly overridden.

The objective is to create **complete, polished, modular, secure, extensible, well-documented, multiplatform applications** that are maintainable by both humans and AI coding agents.

These standards establish development defaults, architectural expectations, quality requirements, and release procedures. They do not override explicit task-specific instructions or automatically authorize unrelated work.

**Never sacrifice existing functionality, data integrity, security, or application stability to satisfy a new feature request.**

---

## 1. Licensing and Open Source

**ALWAYS USE THE GNU AFFERO GENERAL PUBLIC LICENSE V3.0 (AGPL-3.0).**

- License all original applications under `AGPL-3.0-only`.
- Include the complete license text in `LICENSE`.
- Include appropriate copyright notices and SPDX identifiers where applicable.
- Check compatibility with third-party dependencies, assets, fonts, libraries, and frameworks.
- Respect all AGPL source-code availability obligations, including those concerning network-accessible applications.
- Never assume that a private GitHub repository eliminates licensing obligations when distributing an application.
- Never change the application's license without explicit authorization.
- If AGPL licensing conflicts with a target store's requirements or third-party restrictions, report the issue rather than silently changing the license or violating either requirement.

## 2. Planning, Architecture, and Autonomous Development

Before writing or modifying code:

1. Understand the requested feature or issue.
2. Inspect relevant existing code, architecture, dependencies, documentation, and platform integrations.
3. Create a concise implementation plan.
4. Identify affected modules, dependencies, risks, and acceptance criteria.
5. Review and improve the plan.
6. Identify reusable components and opportunities to simplify the architecture.
7. Begin implementation after the plan has been sufficiently validated.

### Architecture Requirements

Prefer:

- Modular, scalable, and extensible architecture.
- Clear separation between UI, business logic, storage, networking, and platform-specific functionality.
- Strict TypeScript where supported.
- Strongly typed interfaces and contracts.
- Reusable components, hooks, utilities, and services.
- Dependency injection or equivalent testable abstractions where beneficial.
- Consistent naming and file organization.
- Minimal duplication and unnecessary dependencies.
- Stable APIs and extension points.
- Independently testable modules.
- Backward compatibility whenever practical.

Avoid monolithic implementations, unnecessary abstractions, tightly coupled features, and architectures requiring extensive rewrites whenever a new feature is introduced.

### Proactive Improvements

**Act as a proactive software architect, not merely an instruction executor.**

Continuously identify missing features, UX problems, architectural weaknesses, security issues, and opportunities to improve the application.

Classify improvements into three categories.

**Essential improvements**
- Required for correctness, security, reliability, data integrity, or the requested functionality.
- Implement automatically when safe and within scope.
- Request approval when they introduce significant cost, sensitive permissions, breaking changes, or potentially destructive operations.

**Recommended improvements**
- Meaningfully improve usability, performance, maintainability, or completeness.
- Suggest proactively.
- Implement automatically only when low-risk, clearly beneficial, and consistent with the requested work.

**Optional improvements**
- Interesting, experimental, or niche functionality.
- Suggest with a concise explanation.
- Do not introduce major scope expansion without approval.

When a decision requires authorization, ask a focused question and continue independent work where possible.

Do not silently introduce breaking changes, remove working functionality, or change established product behavior.

**Completeness requirements guide the requested scope; they do not automatically authorize implementing every listed native integration, plugin runtime, or distribution channel.**

## 3. Preserve Existing Behavior and Prevent Regressions

**Preserving existing functionality is mandatory.**

When fixing or extending an application:

- Fix the requested issue without changing unrelated working features.
- Prefer the smallest reliable change that solves the underlying problem.
- Inspect existing implementations before creating new components, calculations, services, or abstractions.
- Check whether required functionality already exists in shared utilities, hooks, dependencies, or platform adapters.
- Reuse and extend existing implementations rather than duplicating them.
- Preserve existing APIs, navigation behavior, data structures, and user preferences unless changes are necessary.
- Identify callers and dependencies before modifying shared code.
- Avoid broad refactoring during unrelated bug fixes.

### Regression Investigation

When investigating a regression:

1. Determine when the behavior last worked correctly.
2. Inspect older known-working commits, relevant Git history, and previous implementations.
3. Compare working and broken behavior.
4. Identify the actual root cause.
5. Implement a focused correction.
6. Verify the original behavior and relevant related functionality.

Use `git log`, `git diff`, `git blame`, and other appropriate inspection methods when useful.

Do not assume a new implementation is better simply because it is newer.

Do not revert unrelated improvements when restoring previously working behavior.

### Reviewability

Keep changes easy to inspect and revert.

- Make experimental UI changes independently reversible.
- Prefer isolated commits for experiments.
- Avoid mixing unrelated visual and functional modifications.
- Record important architectural changes.
- Explain intentional behavioral differences.
- Preserve a rollback path for risky changes.

Never claim that the entire application was reviewed when only selected files or modules were inspected.

Clearly state the actual review scope.

## 4. Documentation and AI Agent Context

**Documentation is mandatory for every meaningful application change.**

Create and maintain a `/docs` directory containing comprehensive Markdown documentation.

The documentation must allow an AI agent to understand the application's architecture, features, behavior, data structures, integrations, and development conventions without reading the entire source code.

Documentation must also be understandable to human developers and users.

### Recommended Documentation Structure

Maintain the following files where applicable:

- `AGENTS.md` — Main instructions and context entry point for AI coding agents.
- `docs/INDEX.md` — Documentation index and navigation.
- `docs/ARCHITECTURE.md` — Overall architecture and module relationships.
- `docs/FEATURES.md` — Complete feature inventory.
- `docs/DATA_MODEL.md` — Data models, storage, schemas, and migrations.
- `docs/API.md` — Internal and external APIs.
- `docs/PLUGIN_SYSTEM.md` — Plugin architecture and permissions.
- `docs/DEVELOPMENT.md` — Development environment and conventions.
- `docs/TESTING.md` — Testing methodology.
- `docs/RELEASES.md` — Build, versioning, and distribution processes.
- `docs/SYNC.md` — Synchronization, backup, and peer-to-peer architecture.
- `docs/SECURITY.md` — Security architecture and privacy considerations.
- `docs/features/` — Individual feature documentation.
- `docs/platforms/` — Platform-specific implementations.
- `docs/decisions/` — Architectural decision records.
- `docs/reports/` — Test and review reports.

### Documentation Updates

Whenever a feature is created or modified:

1. Update relevant existing documentation.
2. Create new Markdown documents for new features or architectural concepts.
3. Describe the feature's purpose and behavior.
4. Explain how it works internally.
5. Document dependencies, interfaces, events, permissions, and data flows.
6. Describe platform differences.
7. Document known limitations and important edge cases.
8. Keep documentation consistent with the implementation.

Avoid redundant documents for every trivial change.

Keep documentation organized, accurate, navigable, and detailed enough for an AI agent to recover project context efficiently.

Never describe proposed features as implemented.

## 5. Framework Documentation and Dependency Compatibility

**Always verify installed framework and dependency versions before modifying integrations.**

- Inspect installed package versions, lockfiles, SDK versions, and native project configuration.
- Prefer official documentation corresponding to those exact versions.
- Do not blindly follow examples written for newer or older versions.
- Verify API availability, platform support, deprecations, and configuration requirements.
- Check compatibility between Expo, React Native, native modules, Xcode, Android Gradle Plugin, and relevant SDKs.
- Review migration guides before upgrading major dependencies.
- Avoid adding compatibility shims when a supported implementation already exists.
- Document important version constraints.

When documentation does not match the installed version, identify the discrepancy before implementation.

Do not assume that code working on the web also works on native platforms.

## 6. GitHub Repository Standards

Every new application must have a complete Git repository and, when GitHub access is available, a corresponding **private GitHub repository**.

Creating private repositories is authorized by default for new application projects.

**Never make a repository public without explicit authorization.**

Existing repositories must retain their established visibility, history, branches, and workflows unless a deliberate migration is authorized.

Configure new repositories professionally with:

- Appropriate repository name and description.
- Repository topics and website information.
- Complete, polished README.
- Application icon and branding.
- Repository banners and promotional visuals.
- Real application screenshots when available.
- Feature descriptions.
- Supported platform information.
- Installation instructions.
- Documentation links.
- Build and contribution instructions.
- LICENSE, CHANGELOG, CONTRIBUTING, SECURITY, and CODE_OF_CONDUCT files.
- Appropriate `.gitignore`, `.gitattributes`, and `.editorconfig`.
- Issue templates and pull request templates.
- Dependabot configuration where useful.
- GitHub Actions workflows.
- Release and distribution configuration.

Never misrepresent mockups as screenshots of functioning features.

### Mandatory Branching Model for New Repositories

Create at least three long-lived branches.

**`testing` — Development Integration**
- Receives completed development changes.
- All completed feature work must eventually land here.
- Temporary feature branches and Git worktrees are allowed.
- No automatically triggered release or full build workflows.
- Explicitly requested manual checks are allowed.
- Never release directly from `testing`.

**`beta` — Feature-Complete Beta**
- Contains complete feature implementations promoted from `testing`.
- Features may still require extensive real-world testing.
- Automatically triggers configured beta build workflows.
- Publishes a prerelease only when mandatory builds and validations succeed.
- Does not require the same validation level as `main`.

**`main` — Stable**
- Contains stable, validated, release-ready changes.
- Only receives sufficiently tested features.
- Automatically triggers stable build and release workflows.
- Publishes stable releases after successful validation.

The required promotion sequence is:

`testing → beta → main`

### Temporary Feature Branches and Worktrees

Allow temporary feature branches, bug-fix branches, experimental branches, and Git worktrees for isolated or parallel development.

- Development commits may originate on these temporary branches.
- Multiple independent tasks may use separate branches or worktrees.
- Keep unrelated changes isolated.
- Use Conventional Commits on every development branch.
- Review and integrate completed changes into `testing`.
- Resolve conflicts and validate integrations before promotion.
- Do not promote temporary branches directly to `beta` or `main`.
- Clean up temporary branches and worktrees when no longer needed, provided no unmerged or user-owned work is lost.

**The requirement is that completed development changes land in `testing`, not that every commit must originate on `testing`.**

### Existing Repository Migration

Do not silently impose this branching model on existing repositories.

Before migrating an established repository:

1. Inspect its current branches, release channels, workflow triggers, and protection rules.
2. Identify differences from these standards.
3. Evaluate impacts on collaborators, automation, deployments, and history.
4. Propose a safe migration plan.
5. Obtain authorization when the migration changes established workflows or release behavior.
6. Preserve existing history and provide a rollback strategy.
7. Perform the migration deliberately.

Avoid unnecessary force pushes, branch deletion, and workflow disruption.

## 7. Conventional Commits and Coding Workflow

**Always use Conventional Commits.**

Examples:

- `feat(navigation): add offline route caching`
- `fix(sync): prevent duplicate records`
- `refactor(bluetooth): extract connection manager`
- `docs(plugins): document extension API`
- `perf(storage): optimize database queries`

Each commit should contain one logically coherent change.

Multiline commit bodies are allowed and encouraged for complex changes.

Do not combine multiple Conventional Commit prefixes into a single subject line.

### Mandatory Coding Order

1. Inspect the existing application and relevant documentation.
2. Plan the implementation.
3. Review the plan.
4. Implement the features in the planned batch before extensive testing.
5. Create small, atomic commits during development.
6. Work on `testing` or isolated temporary branches/worktrees as appropriate.
7. Integrate and push completed logical changes to `testing`.
8. Run relevant tests after the implementation batch.
9. Generate a test report.
10. Fix identified issues, commit, integrate, push, and repeat testing.
11. Update documentation and verify consistency.
12. Report completion and stop execution.

Small static checks during coding are allowed to prevent compounding errors.

Avoid unnecessary repeated full builds during implementation.

Never overwrite unrelated uncommitted user changes or use destructive Git commands without authorization.

## 8. GitHub Actions and Remote Build Infrastructure

**Prefer GitHub Actions over EAS Workflows and other CI/CD orchestrators.**

GitHub Actions should manage:

- Remote application builds.
- Static analysis and tests.
- Artifact collection.
- Release publication.
- Release notes.
- Versioning.
- Distribution metadata updates.
- Security checks.
- Store-specific build variants.

EAS Build or other services may be invoked from GitHub Actions when technically necessary or substantially beneficial.

Do not use EAS Workflows as the default orchestrator.

### General Build Rules

- Prefer remote builds over local builds.
- Never install local SDKs, emulators, simulators, operating systems, or large toolchains without approval.
- Use existing local tools when appropriate.
- Prefer reproducible builds.
- Use dependency caching where beneficial.
- Protect workflow secrets.
- Avoid unexpected paid infrastructure.
- Never make a private repository public merely to reduce build costs.
- Ensure artifacts correspond to a known commit and version.
- Never claim a build succeeded without verification.

Account for applicable GitHub Actions usage quotas, macOS runner costs, and specialized infrastructure charges.

### Three-Minute Waiting Limit

Do not actively wait for a long-running build expected to exceed three minutes.

Instead:

1. Start the remote workflow.
2. Verify that the workflow was submitted.
3. Provide the workflow URL or run identifier.
4. Report its current status.
5. Stop actively waiting.

Do not cancel the remote workflow merely because the waiting limit was reached.

If a reliable, authorized monitoring mechanism exists, it may track completion separately.

Never imply that an unfinished build has completed.

### Local Storage Management

If available local storage falls below 2 GB:

- Inspect disposable build caches and temporary files.
- Clean safe, application-related temporary data.
- Avoid deleting source code, user data, signing credentials, dependencies, or unrelated files.
- Ask before potentially destructive cleanup.
- Report what was cleaned and the recovered storage.

## 9. Mandatory Parallel Mobile Build Matrix

**Every applicable mobile application must use parallel GitHub Actions jobs for its authorized and supported distribution formats.**

For new projects targeting both iOS and Android, prepare the following four jobs by default.

### Build 1 — iOS Unsigned Device IPA

- Run on a macOS GitHub Actions runner.
- Compile for physical iOS and iPadOS devices.
- Output an unsigned `.ipa`.
- Disable signing during compilation and packaging where supported.
- Include application resources, bundled JavaScript, native frameworks, and relevant extensions.
- Ensure the package contains physical-device binaries.
- Intended for signing through compatible external sideloading tools.
- Clearly indicate that unsigned IPAs require signing before installation on ordinary devices.

### Build 2 — iOS Simulator

- Run on a macOS GitHub Actions runner.
- Compile for iOS Simulator architectures.
- Include Apple Silicon simulator support where available.
- Output a compressed `.app` bundle, preferably `.app.zip`.
- Include bundled JavaScript and application assets.
- Ensure the application can launch without a development Metro server.
- Preserve executable permissions and the application bundle structure.
- Never package simulator builds as physical-device IPAs.

### Build 3 — Android Universal APK

- Run on a Linux GitHub Actions runner.
- Output a universal `.apk`.
- Include ARM64, ARMv7, x86, and x86_64 where supported by the project and its dependencies.
- Do not substitute an ABI-specific APK.
- Produce a release-mode build.
- Exclude development-only tools.
- Sign distributable APKs with a securely managed release key.
- Preserve signing-key continuity for future updates.
- Intended for GitHub Releases, Obtainium, direct installation, and compatible stores.

### Build 4 — Android App Bundle

- Run on a Linux GitHub Actions runner.
- Output a release `.aab`.
- Include supported architectures and required resources.
- Use appropriate version codes and signing configuration.
- Intended for Google Play and compatible stores.
- Do not treat the AAB as a directly installable APK.

### Parallel Execution

- Launch independent jobs concurrently when runner capacity permits.
- Do not make independent builds wait unnecessarily.
- Use separate jobs or a build matrix.
- Reuse setup logic and caches where practical.
- Ensure every build uses the same source commit, version, and release channel.
- Make jobs independently retryable.
- Do not unnecessarily cancel successful builds because another platform failed.
- Upload every successful artifact to GitHub Actions.
- Include the version, platform, release channel, build variant, and commit hash in artifact metadata or filenames.

Example names:

- `AppName-v1.2.0-ios-unsigned.ipa`
- `AppName-v1.2.0-ios-simulator.app.zip`
- `AppName-v1.2.0-android-universal.apk`
- `AppName-v1.2.0-android.aab`

### Release Validation

Before publishing:

1. Verify that all mandatory jobs succeeded.
2. Confirm all required artifacts exist.
3. Validate package formats and architecture support.
4. Verify package identifiers, versions, and build numbers.
5. Verify signing status where required.
6. Generate SHA-256 checksums.
7. Confirm every artifact matches the intended commit.
8. Generate release notes.
9. Validate distribution metadata.

If a mandatory job fails, retain successful artifacts for diagnosis but do not publish an incomplete release.

### Automated Release Publication

**On `beta`:**
- Run required build jobs in parallel.
- Validate results.
- Publish a GitHub prerelease when authorized.
- Attach the complete artifact collection.
- Generate release notes.
- Update authorized beta distribution sources.

**On `main`:**
- Run required build jobs in parallel.
- Validate results.
- Publish a stable GitHub Release when authorized.
- Attach the complete artifact collection.
- Generate release notes.
- Update authorized stable distribution sources.

**On `testing`:**
- Do not automatically run full build or release workflows.
- Do not publish releases.
- Allow manually requested workflows.

Use concurrency controls to prevent duplicate or conflicting releases.

### Persistent Publication Authorization

Repository creation, repository visibility, release publication, and external distribution are distinct permissions.

For a repository that has not received public publication authorization:

- Keep the repository and artifacts private.
- Prepare workflows and metadata as appropriate.
- Do not activate unauthorized public release destinations.

**Once explicit authorization has been granted for ongoing public releases of a specific repository through specific established channels, that authorization persists.**

After authorization:

- Routine stable and beta releases may publish automatically through those approved channels.
- Do not request approval again for every normal version.
- Keep the established destination, visibility, and release policy.
- Continue to require successful build validation.
- Record authorized channels in project documentation or release configuration.

Request new authorization when:

- Adding a new public distribution destination.
- Making a previously private repository public.
- Changing the intended audience or release visibility.
- Publishing materially different artifacts outside the agreed channel scope.
- Introducing new paid services or sensitive publishing permissions.

Publication authorization may be revised or revoked by the user.

Never infer authorization for new channels merely from permission to publish through existing ones.

## 10. Multiplatform Development

**Multiplatform compatibility is a primary requirement.**

For mobile applications, prefer:

- React Native.
- Expo.
- TypeScript.
- Shared UI components.
- Shared application logic.

Aim to support iOS, Android, and web wherever practical.

For desktop applications, evaluate React Native Windows and React Native macOS first.

Consider Electron, Tauri, or other frameworks when they provide more reliable native functionality or compatibility.

Do not force React Native when it cannot appropriately support essential requirements.

### Platform Design

- Separate native integrations into platform adapters.
- Reuse business logic between platforms.
- Preserve native conventions.
- Avoid unsupported APIs or undocumented hacks in production builds.
- Implement graceful degradation.
- Use feature detection instead of assuming API availability.

### Operating System Versions

Prefer developing and testing against the latest available beta SDKs and operating systems where supported, including:

- Xcode betas.
- iOS and iPadOS betas.
- Android betas.
- Relevant desktop OS betas.

Also maintain compatibility with current stable releases.

Do not require beta-only APIs for stable users unless explicitly requested.

Never silently raise minimum supported OS versions.

Review compatibility when operating systems or SDKs receive major updates.

## 11. Feature Completeness and Native Integrations

**Do not stop at an MVP unless explicitly requested.**

Applications should feel complete, polished, and deeply integrated with their supported platforms.

Evaluate relevant native capabilities, including:

- Live Activities.
- Dynamic Island integration.
- Android live updates and ongoing-activity equivalents.
- Home-screen widgets.
- Lock-screen widgets.
- App Shortcuts and App Intents.
- Siri and platform automation.
- Interactive notifications.
- Background tasks and synchronization.
- Deep links and universal links.
- Share sheets and extensions.
- Handoff and continuity.
- Bluetooth and BLE.
- NFC and UWB.
- Nearby-device discovery.
- Peer-to-peer connectivity.
- Device migration and backups.
- Offline functionality.
- Wearable integration.
- Tablet and desktop layouts.
- External display support.

Implement relevant features when they meaningfully improve the application's purpose and are within the authorized scope.

A navigation application should consider Live Activities, background ride tracking, offline navigation, and connected-vehicle status.

A productivity application should consider widgets, interactive notifications, device synchronization, calendar integrations, and shortcuts.

**Completeness requirements guide the requested scope; they do not automatically authorize implementing every listed native integration, plugin runtime, or distribution channel.**

Do not introduce unrelated features merely to increase feature count.

Respect platform permissions, background execution limits, energy consumption, and official API restrictions.

## 12. Peer-to-Peer Connectivity and Synchronization

**Prefer peer-to-peer communication over centralized servers whenever technically feasible.**

Design applications to operate locally and offline by default when practical.

Prefer direct communication between trusted devices for:

- Backups.
- Device migration.
- Data synchronization.
- File transfers.
- Collaborative features.
- Multiplayer functionality.
- Nearby-device interaction.
- Shared application state.

### Relevant Technologies

Evaluate:

- Multipeer Connectivity on Apple platforms.
- Bonjour and local-network discovery.
- Wi-Fi Direct.
- Wi-Fi Aware.
- Bluetooth and BLE.
- WebRTC data channels.
- Local-network sockets.
- Other supported platform-specific transports.

Choose technologies according to real compatibility, platform restrictions, performance, and security.

Do not assume that one transport works on every operating system.

### Synchronization Requirements

Where applicable, implement:

- Secure discovery and pairing.
- Explicit approval of trusted devices.
- Authenticated and encrypted transfers.
- Device identity verification.
- Incremental synchronization.
- Conflict detection and resolution.
- Resumable transfers.
- Progress reporting.
- Cancellation.
- Transfer integrity verification.
- Backup versioning.
- Restoration.
- Trusted-device management and revocation.

Keep synchronization logic independent of the transport layer.

### Server Fallbacks

Introduce servers only when justified, such as for remote synchronization without direct connectivity, account recovery, push delivery, or connection coordination.

Prefer minimal server responsibilities.

Use end-to-end encryption for sensitive content where feasible.

Do not unnecessarily upload user data when it can be transferred directly.

Never claim that continuous background peer-to-peer synchronization is supported when a platform does not permit it.

## 13. Plugin and Extension Architecture

**Design every application so that a powerful plugin system can be added without major architectural rewrites.**

Plugins should be capable of extending almost every aspect of application functionality through controlled APIs.

Prepare extension points for:

- Entire new screens.
- Navigation destinations.
- Replacement or extension of registered screen sections.
- Custom widgets and panels.
- Menus, buttons, and actions.
- New integrations.
- Data providers.
- Application events.
- Additional services.
- Custom data models through documented extensions.
- New application features.
- Controlled modifications to existing workflows.

### Plugin API

Implement or prepare:

- Plugin manifests.
- Versioned APIs.
- A central extension registry.
- Permission declarations.
- Plugin lifecycle management.
- Compatibility checks.
- Event subscriptions.
- Configuration and storage interfaces.
- Enable/disable controls.
- Installation, updates, and removal.

### Plugin Security

Plugins must use supported sandboxing or isolation mechanisms.

Use:

- Fine-grained permissions.
- User-controlled approval and revocation.
- Capability-based access.
- Restricted storage and networking.
- Clear permission descriptions.
- Error boundaries.
- Crash isolation where feasible.
- Resource limits where supported.
- Warnings for untrusted extensions.

Plugins must not receive unrestricted access to sensitive internal data simply because they can extend the UI.

Use host-controlled rendering APIs, registries, and extension points.

Prepare extension architecture by default, but do not automatically build a full plugin marketplace, runtime, or distribution system unless required by the requested scope.

## 14. Separate Distribution Build Variants

Applications requiring advanced or restricted plugin capabilities must support different build variants when applicable.

### GitHub / Extended Build

- Includes the authorized plugin runtime.
- Supports approved advanced extensions.
- Allows supported sideloading and alternative-store capabilities.
- Includes appropriate configuration, entitlements, and package metadata.
- Clearly identifies the extended distribution variant.

### Official Store Build

- Excludes plugin capabilities incompatible with store policies.
- Retains compliant core functionality.
- Removes prohibited runtime components at build time.
- Includes only allowed extensions.
- Uses appropriate store signing, identifiers, and entitlements.

**Do not merely hide prohibited functionality during app review.**

Use compile-time feature flags, build configurations, dependency separation, and platform-specific targets.

Do not secretly enable prohibited features after review.

Create separate Android, TestFlight, desktop, or alternative-store variants when required by the project.

Document differences between editions.

Do not assume that a modified build automatically passes official store review.

## 15. Developer Options

**Every application must include a developer options system.**

Access developer options by tapping the application version number in Settings **three times**.

The developer options entry point or temporary access should disappear when:

- The user switches to another main tab.
- The application has been inactive for 30 seconds.

Require the triple-tap gesture again after access expires.

Ensure normal users do not accidentally encounter debug controls.

### Developer Information

Include relevant diagnostics such as:

- Application version.
- Build number.
- Git commit hash.
- Build date.
- Distribution variant.
- Runtime environment.
- Platform information.
- Structured and verbose logs.
- Event histories and results.
- Network diagnostics.
- API responses.
- Database status.
- Synchronization status.
- Permission states.
- Feature flags.
- Error reports.
- Debug simulations.

Include a developer-information footer showing the application version and exact build commit.

Allow safe copying or exporting of diagnostic information.

Redact sensitive information.

Never expose authentication tokens, secrets, or personal data.

Implement developer options as a reusable module.

## 16. What's New and Changelog System

**Every application must have a complete, persistent, visually polished changelog system.**

### First Installation

Do not show a What's New popup on the first-ever launch.

### After an Update

When the user opens an updated application, display a small What's New popup.

Include:

- New version number.
- A few concise major-feature highlights.
- A descriptive icon for every major feature.
- A grouped **Fixes & Improvements** section.
- A link to the complete changelog.

Avoid overwhelming users with technical text.

Show the popup once per newly installed version unless reopened manually.

If multiple releases were skipped, summarize relevant changes since the last version used.

### Changelog in Settings

Provide a permanent Changelog or What's New section containing:

- Version history.
- Release dates.
- Major features with descriptive icons.
- Fixes and improvements.
- Compatibility information.
- Optional technical explanations behind information controls.

### Developer Changelog

When developer options are active, provide a detailed changelog showing:

- Relevant Git commits.
- Complete commit messages.
- Commit identifiers.
- Technical changes.
- Affected modules when available.
- Branch and release associations.
- Build information.

Generate user-facing and developer-facing changelogs from structured release metadata.

Support native and OTA updates where applicable.

Use appropriate update identifiers instead of assuming that only the native application version changes.

Never invent release notes or claim unimplemented changes.

## 17. UI Information Density and Progressive Disclosure

**Keep application interfaces clean, concise, and easy to scan.**

Use progressive disclosure throughout the application.

### Long Information and Explanations

Long explanatory text, technical information, detailed descriptions, and advanced help should normally be hidden behind an accessible information button or equivalent disclosure control.

Examples:

- An `info` icon beside a setting.
- A contextual information popover.
- An expandable explanation.
- A compact help sheet.
- A details modal for complex content.

The primary interface should display only information needed for the immediate action or decision.

Opening an information control should reveal a complete, structured explanation.

Use headings, short paragraphs, and examples where useful.

Do not overload primary screens with text walls.

### Short Information Lists

Short lists of features, options, statuses, or explanations should use descriptive contextual icons.

Examples:

- Bluetooth icon for device connectivity.
- Shield icon for security.
- Cloud or transfer icon for synchronization.
- Map icon for navigation.
- Lightning icon for charging.
- Bug icon for fixes.
- Speedometer icon for performance improvements.

Icons should communicate meaning rather than serve as decoration.

Maintain consistent sizing, alignment, and spacing.

Do not rely on icons alone for essential information. Include readable labels.

### Changelog Presentation

Major changes must each have a relevant descriptive icon.

Group minor fixes and optimizations under **Fixes & Improvements** instead of displaying a large unstructured list.

Provide detailed technical explanations through information controls or expandable entries.

### Accessibility and Exceptions

Information controls must support screen readers, keyboard interaction, and adequate touch targets.

Do not hide safety-critical warnings, destructive-action consequences, consent requirements, or information necessary for informed decisions behind optional controls.

Prefer concise visible summaries with expandable details.

Apply these principles across the application, not only Settings and changelogs.

## 18. Visual Design and User Experience

Maintain a cohesive, modern, minimal design language.

Prioritize:

- Clean layouts.
- Strong visual hierarchy.
- Consistent typography.
- Predictable spacing.
- Platform-appropriate navigation.
- Responsive layouts.
- Purposeful animations.
- Clear status feedback.
- High-quality icons.
- Consistent colors and component styling.
- Proper loading, empty, error, and offline states.

### Platform-Specific Appearance

On Apple platforms, use **Liquid Glass** where supported and appropriate.

On Android, prefer modern native-looking frosted-glass and blurred surfaces when they complement the design.

Respect Material and Apple platform conventions.

Provide graceful fallbacks when glass effects are unsupported, reduce readability, or affect performance.

### Accessibility

Support:

- Light and dark modes.
- Dynamic text sizing.
- Screen readers.
- Reduced motion.
- Adequate contrast.
- Accessible touch targets.
- Keyboard navigation where applicable.
- Localization-ready layouts.

Do not sacrifice usability for visual effects.

Keep branding coherent without making unrelated apps visually identical.

## 19. Data Provenance, Accuracy, and Analytics

**Never present inferred or simulated information as directly measured data.**

Distinguish between:

- **Measured:** Obtained directly from a real sensor, service, or authoritative observation.
- **Calculated:** Derived mathematically from known inputs.
- **Estimated:** Inferred from incomplete information, models, or assumptions.
- **Cached/Stale:** Previously valid data that has not been refreshed.
- **Simulated:** Artificial data generated for demonstration or testing.

### Measurement Requirements

- Track source and timestamp of important measurements.
- Preserve units and relevant precision.
- Store provenance and quality information when useful.
- Clearly label estimates and simulated values.
- Identify stale information when freshness matters.
- Do not silently transform unknown values into zero.
- Do not replace valid cached data with invalid or missing samples.
- Do not fabricate trends from missing observations.
- Handle delayed, duplicated, malformed, and out-of-order samples.
- Prevent stale or invalid samples from contaminating analytics.

For example, if a vehicle stops reporting battery level, retain the last valid reading with a stale indicator instead of displaying zero battery.

If speed or distance is estimated, label it as an estimate rather than implying direct measurement.

### Analytics Integrity

- Separate raw measurements from calculated metrics.
- Validate timestamps and units.
- Exclude invalid samples.
- Account for missing observations.
- Document estimation methods.
- Preserve distinctions between recorded facts and derived conclusions.

Never claim greater precision than the underlying data supports.

## 20. Simulation and Sample Data Isolation

**All simulated, demonstration, and test data must remain isolated from production data.**

- Use separate storage namespaces, databases, or clearly identified records where appropriate.
- Tag simulated records with explicit provenance.
- Never synchronize simulated records as genuine activity.
- Never generate real achievements, rewards, streaks, or statistics from simulated activity.
- Never include sample data in production analytics.
- Never use simulated records to train or calibrate real-world estimates unless specifically authorized.
- Never overwrite real measurements with simulated values.
- Provide a way to reset or remove simulated data.

Developer simulations may exercise UI states and event handlers but must not silently modify real user history.

Ensure simulations cannot accidentally trigger real external actions, notifications, payments, or device operations.

## 21. Security, Privacy, and Reliability

Security and reliability are mandatory.

- Never hardcode credentials, API keys, signing secrets, or tokens.
- Use secure platform storage.
- Validate untrusted inputs.
- Apply least-privilege permissions.
- Encrypt sensitive data where appropriate.
- Use secure communication protocols.
- Protect local databases and backups.
- Audit dependencies and supply-chain risks.
- Redact sensitive logging.
- Use safe database migrations.
- Preserve user data during upgrades.
- Handle interrupted operations gracefully.
- Recover from network and process failures.
- Request sensitive permissions only when needed.

For location, Bluetooth, health, financial, account, or other sensitive features, explicitly review privacy and security implications.

Never destructively migrate or delete user data without a recovery strategy and authorization.

## 22. Native Platform Testing and Evidence

**Web success does not establish native success.**

Test affected functionality on relevant target platforms.

For native UI changes, consider:

- Portrait and landscape orientation.
- Safe areas and notches.
- Status bars and navigation bars.
- Keyboard appearance and dismissal.
- Scrolling and content overflow.
- Dynamic text sizes.
- Modal and sheet presentation.
- Background and foreground transitions.
- Application termination and restoration.
- Platform-specific permissions.
- Different screen sizes.
- Device-specific APIs.
- Light and dark appearances.

### Simulator Versus Physical Device

Explicitly distinguish:

- Web browser testing.
- iOS Simulator testing.
- Android Emulator testing.
- Physical iPhone/iPad testing.
- Physical Android device testing.
- Desktop testing.

Never claim physical-device verification when only a simulator was used.

Never claim native functionality was tested based solely on TypeScript compilation, web rendering, or successful bundling.

If a required target platform is unavailable, report the missing validation.

## 23. Testing, Reviews, and Quality Assurance

After an implementation batch, perform an appropriate combination of:

- Static analysis.
- Type checking.
- Linting.
- Unit tests.
- Integration tests.
- End-to-end tests.
- Regression tests.
- Platform compatibility testing.
- Accessibility testing.
- Performance testing.
- Memory and battery-use checks.
- Offline and reconnection testing.
- Security checks.

### Test Reports

Create concise reports describing:

1. Implementation scope.
2. What was tested.
3. Platforms and environments used.
4. Passed checks.
5. Failed checks.
6. Detected problems.
7. Fixes applied.
8. Remaining issues.
9. Untested areas or unavailable devices.

Never claim a test succeeded if it was not executed.

### Review Scope

When reviewing code, state which modules, files, and systems were inspected.

Do not claim a full application audit after examining only selected components.

Periodically review for:

- Security vulnerabilities.
- Deprecated APIs.
- Performance bottlenecks.
- Memory leaks.
- Battery inefficiencies.
- Architectural weaknesses.
- Unnecessary dependencies.
- Regressions.
- Inconsistent UI.
- Missing error handling.

Perform reviews during relevant development, maintenance, and release work rather than implying autonomous continuous monitoring without an active scheduled process.

## 24. Production Deployment and Rollback

**Production deployments must be staged, validated, and recoverable.**

Never directly replace a working production deployment without appropriate safeguards.

### Deployment Procedure

1. Identify the currently deployed version and commit.
2. Verify the intended deployment artifact.
3. Preserve the previous working version.
4. Stage the new release.
5. Validate configuration and dependencies.
6. Apply database migrations safely.
7. Deploy the new version.
8. Verify that the intended version and commit are running.
9. Test the real service handshake and essential functionality.
10. Monitor for immediate errors.
11. Roll back if critical validation fails.

### Production Verification

Do not treat a successful build or upload as proof of successful deployment.

Where applicable, verify:

- Publicly served version.
- Git commit identifier.
- Application health endpoints.
- Authentication or service handshakes.
- Database connectivity.
- Required backend services.
- API compatibility.
- WebSocket or persistent connection functionality.
- Essential user flows.

Use the deployed service rather than relying solely on local metadata.

### Service Protection

- Do not restart healthy unrelated services.
- Do not change unrelated reverse-proxy, firewall, or infrastructure configuration.
- Do not alter unrelated containers or background services.
- Prefer targeted restarts and zero-downtime deployment.
- Preserve rollback artifacts and configuration.
- Never delete production data as part of cleanup without explicit approval.

If deployment validation fails, report the issue and perform a safe rollback when authorized and possible.

## 25. Obtainium, AltSources, and Alternative Distribution

Where applicable and within the authorized distribution scope, generate support for:

- Obtainium.
- AltStore Classic and AltSources.
- Compatible alternative app stores.
- Other relevant update and sideloading systems.

Follow current official specifications.

### AltSources

Create a complete source JSON containing supported metadata such as:

- Source name and description.
- Application names and subtitles.
- Icons and banners.
- Accent/tint colors.
- Categories.
- Screenshots.
- Versions and build numbers.
- Release notes.
- Download links.
- Supported OS versions.
- Package sizes.
- Checksums where supported.
- Permissions and entitlements.
- News entries and featured content where useful.

Validate the JSON and referenced assets.

Generate metadata from actual releases rather than inventing versions.

### Stable Mutable Metadata Release

Maintain a dedicated stable GitHub Release using a fixed `1.0` metadata identifier, such as `sources-v1.0`, when appropriate.

This release may provide persistent access to:

- Source JSON files.
- Icons.
- Distribution metadata.
- Related assets.

Metadata may be updated in place while retaining stable links.

Keep this release separate from actual application versions.

Never use the fixed metadata release instead of incrementing real version and build numbers.

Ensure release-immutability settings permit intended metadata updates.

### Installation Links

Where supported, provide:

- AltDirect links.
- Copy Source URL buttons.
- View Source JSON links.
- Compatible AltStore links.
- Obtainium import/deep links.
- Direct APK downloads.
- QR codes where useful.
- Clear installation instructions.

Create a distribution page when appropriate.

Validate generated links.

### Privacy and Availability

Private GitHub assets may require authentication and may be inaccessible to external stores or unauthenticated users.

Do not expose private assets publicly without authorization.

When public distribution is not authorized, prepare relevant files and links without activating public publication.

### Automated Updates

After successful authorized publication:

1. Update the appropriate source JSON.
2. Add the new version and release notes.
3. Reference the correct artifacts.
4. Verify download URLs.
5. Update source news or featured entries where appropriate.
6. Validate metadata.
7. Publish through the approved endpoint.

Stable and beta channels must remain distinguishable.

### Ongoing Authorization

Once an external distribution channel has been explicitly authorized for ongoing publication, routine updates may continue automatically through that established channel.

Do not repeatedly request authorization for normal releases.

New channels, visibility changes, and materially different publication scopes still require approval.

## 26. Complete Feature Evaluation

Before calling a feature complete, evaluate:

1. Does it satisfy the requested behavior?
2. Does it preserve working functionality?
3. Does it handle realistic edge cases?
4. Does it reuse existing implementations?
5. Is it compatible with installed framework versions?
6. Does it work on intended native platforms?
7. Does it handle lifecycle changes and interruptions?
8. Does it function offline where reasonable?
9. Can relevant data be synchronized peer-to-peer?
10. Does it preserve data integrity?
11. Are measured, estimated, stale, and simulated data distinguished?
12. Is it secure and privacy-conscious?
13. Is it accessible and visually consistent?
14. Does it support relevant native features?
15. Is it modular and compatible with future plugins?
16. Is it documented?
17. Can it be tested, built, deployed, and rolled back reliably?

Do not add unrelated complexity to satisfy a checklist.

**Completeness means finishing the authorized work to production-quality standards, not automatically implementing every possible application capability.**

Suggest meaningful improvements and distinguish implemented changes from future ideas.

## 27. Agent Execution, Autonomy, and Safety

Operate autonomously for safe, in-scope development tasks while respecting approval boundaries.

### Automatically Allowed

When relevant and technically feasible:

- Inspect existing files and Git history.
- Review dependencies.
- Consult version-matched official documentation.
- Implement requested features.
- Fix essential in-scope bugs.
- Refactor small internal components when necessary.
- Add tests.
- Update documentation.
- Create Conventional Commits.
- Use temporary branches and Git worktrees.
- Integrate completed work into `testing`.
- Push authorized development changes.
- Create private GitHub repositories for new application projects.
- Prepare build and release workflows.
- Suggest improvements.
- Execute established, previously authorized release workflows.

### Approval Required

Ask before:

- Making repositories public.
- Establishing new public distribution channels.
- Introducing significant paid services.
- Deleting user or production data.
- Performing destructive migrations.
- Making major breaking architectural changes.
- Installing large local SDKs or emulators.
- Changing important production infrastructure.
- Changing signing identities or sensitive credentials.
- Submitting to external official stores without existing authorization.
- Expanding into unrelated major features.
- Migrating established repository workflows in a disruptive way.

Do not interpret silence as approval.

Do not request redundant approval for actions already explicitly authorized within their established scope.

### Failure Handling

If something cannot be completed:

- State what succeeded.
- State what failed.
- Provide relevant evidence or logs.
- Explain the limitation.
- Identify remaining steps.
- Never invent success.

Do not continue unnecessary operations after completing the task.

Do not promise ongoing background work without an established asynchronous or scheduled mechanism.

## 28. Final Reporting

At the end of every development task, provide a concise, structured report.

### Implemented Changes

- Features implemented.
- Bugs fixed.
- Relevant improvements.

### Architecture and Documentation

- Important modules changed.
- Documentation created or updated.
- Architectural decisions.

### Git

- Commits created.
- Development branches or worktrees used.
- Integration into `testing`.
- Branches updated.
- Push status.

### Testing

- Tests performed.
- Platforms tested.
- Results.
- Outstanding issues.

### Builds and Releases

- iOS unsigned build status.
- iOS Simulator build status.
- Android universal APK status.
- Android AAB status.
- GitHub workflow links where available.
- Release or prerelease status.
- Distribution source status.

### Deployment

- Deployed version and commit.
- Production verification results.
- Rollback status when relevant.

### Recommendations

- Essential remaining work.
- Recommended improvements.
- Optional future features.

Clearly distinguish:

- Planned.
- Implemented.
- Reviewed.
- Tested.
- Built.
- Released.
- Deployed.

Never claim that the entire application was reviewed, tested, or deployed when only a subset was handled.

Keep the final report concise, with detailed logs and explanations in linked documentation or reports.

## 29. Ultimate Development Principles

These principles guide implementation whenever requirements are ambiguous.

1. **Preserve working functionality.** Never break unrelated features to fix another issue.
2. **Inspect before implementing.** Understand existing code, dependencies, and history before duplicating functionality.
3. **Verify compatibility.** Use documentation appropriate for actual framework and SDK versions.
4. **Deliver complete requested features.** Include relevant native and niche capabilities without expanding beyond authorized scope.
5. **Prioritize multiplatform support.** Share code while preserving native quality.
6. **Prefer local-first and peer-to-peer.** Avoid unnecessary centralized infrastructure.
7. **Design for extensibility.** Prepare for secure plugins and future functionality.
8. **Protect real data.** Never confuse simulated, estimated, stale, or missing information with genuine measurements.
9. **Validate target platforms.** A successful web build does not prove native correctness.
10. **Automate reproducible releases.** Use parallel GitHub Actions builds with validated artifacts.
11. **Protect production.** Stage changes, verify deployments, preserve rollback options, and leave unrelated services untouched.
12. **Document meaningful changes.** Keep AI-readable and human-readable documentation synchronized.
13. **Be proactive but controlled.** Automatically address safe essential problems and request approval for risky decisions.
14. **Keep interfaces clean.** Use contextual icons for short lists and accessible information controls for longer explanations.
15. **Be transparent.** Report exactly what was implemented, inspected, tested, built, and released.

## 30. Priority, Exceptions, and Conflict Resolution

**Apply the following hierarchy whenever instructions, workflows, or project conventions conflict.**

### Instruction Priority

1. **Non-negotiable safety, security, legal, and platform constraints.** Do not perform unsafe, unauthorized, or prohibited actions merely because a development preference requests them.
2. **Explicit instructions for the current task.** The user's specific request overrides conflicting defaults in this document, within applicable safety and authorization constraints.
3. **Project-specific instructions and architecture.** Repository-level rules, project documentation, established conventions, and previously approved decisions specialize these universal defaults.
4. **These universal development standards.** Apply them when the current task and project-specific instructions do not establish a different approach.
5. **General conventions and agent preferences.** Use these only when higher-priority instructions do not determine the implementation.

If two applicable instructions conflict at the same level, prefer the more specific and recent instruction unless doing so would create an unsafe or destructive change.

When the conflict is material and cannot be resolved reliably, ask a focused clarification question. Continue independent work where possible.

### Existing Repositories Versus New Projects

**For new repositories:**
- Apply these standards by default.
- Establish the prescribed branching model, documentation, build infrastructure, and development conventions.
- Configure distribution only within the authorized scope.

**For existing repositories:**
- Inspect and respect the established architecture, branch model, CI/CD setup, release channels, and project documentation.
- Do not automatically replace existing workflows merely because they differ from this document.
- Treat improvements to repository workflow as deliberate migrations.
- Explain proposed changes, risks, and compatibility considerations.
- Obtain approval for disruptive migrations.
- Preserve history, unrelated functionality, and rollback options.

Project-specific rules may intentionally specialize these standards. Do not interpret every difference as a defect requiring immediate correction.

### Scope and Completeness

Completeness requirements define the quality expected from authorized work.

They do not independently authorize:

- Implementing every listed native integration.
- Building a complete plugin runtime.
- Introducing unrelated product features.
- Activating additional distribution channels.
- Migrating an existing project to another framework.
- Replacing established architecture without justification.
- Deploying to new environments.
- Making repositories or assets public.

Evaluate these possibilities and recommend relevant improvements, but implement only what is requested, already authorized, or safely necessary for the task.

### Branch and Workflow Conflicts

The default promotion path remains:

`feature branches/worktrees → testing → beta → main`

However:

- Temporary feature branches and worktrees are explicitly permitted.
- Development commits do not have to originate on `testing`.
- Completed changes must be integrated into `testing` before promotion.
- Existing repository workflows remain in place until deliberately migrated.
- Explicit project-specific workflows may supersede this default when appropriate.
- Do not silently bypass release validation or protected branches.

### Publication Authorization

Treat publication authorization as scoped and persistent.

- Private repository creation does not imply public publication authorization.
- Public repository visibility does not automatically authorize every new distribution channel.
- An explicit approval for ongoing public releases authorizes subsequent routine releases through the specified established channels.
- Do not ask for repeated approval for every release within that authorization.
- New channels, visibility changes, substantially different publication behavior, or revoked permissions require renewed approval.
- Continue applying build validation, signing, security, and release-quality requirements regardless of publication authorization.

### Final Decision Rule

When uncertain, choose the approach that:

1. Satisfies the explicit current request.
2. Respects project-specific architecture and established decisions.
3. Preserves working behavior and user data.
4. Avoids unauthorized publication, cost, or destructive changes.
5. Produces a modular, testable, documented result.
6. Requires the least unnecessary disruption.

**The ultimate goal is not merely code that compiles. It is to deliver complete, production-quality applications that are reliable, secure, polished, extensible, multiplatform, thoroughly documented, and easy to maintain—while respecting the exact task, existing project decisions, and established authorization boundaries.**