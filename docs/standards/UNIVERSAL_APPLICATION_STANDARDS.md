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

## 31. Automatic Update Detection and In-App Updates

**Every applicable application must support automatic update checks using GitHub Releases as its primary release metadata source.**

The update system must integrate with the application's existing versioning, GitHub Actions release workflows, distribution channels, What's New interface, and changelog history.

### Update Discovery

- Automatically check for updates when the application launches.
- Recheck periodically when the application returns to the foreground, using reasonable throttling and caching.
- Provide a **Check for Updates** option in Settings.
- Display the currently installed version, build number, and update status.
- Compare versions and build numbers correctly rather than relying on release publication dates.
- Distinguish stable releases from prereleases.
- Never mistakenly offer the dedicated mutable `1.0` distribution-metadata release as an application update.
- Do not offer incompatible artifacts, downgrades, or updates intended for another distribution variant.

Use the GitHub Releases API or a validated release manifest generated from GitHub Actions.

Respect GitHub API rate limits, caching headers, and network availability.

For private repositories, use an appropriately secured update service or authenticated distribution mechanism. Never embed long-lived GitHub access tokens or private repository credentials in client applications.

### Release Channels

Support at least:

**Stable**
- Receives validated releases from `main`.
- Never automatically installs beta versions.
- Uses the authorized stable distribution source.

**Beta**
- Receives prereleases from `beta`.
- Can optionally accept newer stable versions when appropriate.
- Uses the authorized beta distribution source.

The application's build configuration should determine its default update channel.

Allow channel switching only where supported and explicitly intended, preventing incompatible updates.

### In-App Android APK Updates

**Android applications distributed as directly installed APKs must support an integrated self-update experience.**

When a newer compatible APK becomes available:

1. Detect the update through GitHub release metadata.
2. Display a compact update notification or modal.
3. Show the new version and relevant release notes.
4. Provide an **Update Now** action.
5. Download the correct universal APK directly within the application.
6. Display download progress, speed, and remaining size when available.
7. Verify download integrity and package compatibility.
8. Initiate installation using the supported Android package installation APIs.
9. Request any required Android system installation permission or confirmation.
10. Preserve application data, settings, accounts, and local storage across the update.
11. Report installation failures clearly and offer retry options.

The user should not need to manually visit GitHub, locate a release, or download an APK through a browser.

Use Android's supported `PackageInstaller` APIs or equivalent system installation flows.

**Never attempt to bypass Android security prompts or installation restrictions.**

Preserve application identifiers and signing-key continuity so downloaded updates can replace existing installations safely.

Check that the downloaded APK is newer, compatible with the device, and signed with the expected signing identity.

Do not allow unsigned or untrusted APKs to replace a trusted installation.

### Download and Installation Experience

Support, where practical:

- Download progress.
- Pause, cancellation, and retry.
- Resumable downloads.
- Appropriate background download handling.
- Network interruption recovery.
- Available-storage checks.
- Metered-network awareness.
- Download integrity verification using published checksums.
- Clear error messages.
- Safe temporary-file cleanup.
- Installation status and result handling.

Do not delete the currently installed application or its data before installing an update.

Do not assume installation succeeded merely because the download completed or the system installer was opened.

When installation requires user action, guide the user through the official Android system interface.

### Google Play and Other Managed Stores

Applications installed through Google Play should use the supported Google Play In-App Updates mechanism where available.

- Use flexible updates for ordinary improvements.
- Consider immediate updates only for justified critical requirements.
- Do not redirect Play Store users to sideload GitHub APKs by default.
- Respect store policies and installer ownership restrictions.

For other managed stores, use their supported update APIs or redirect users to the appropriate store listing.

Where installation-source detection is unreliable, use the configured distribution variant and safe fallbacks rather than assuming the source.

### iOS and iPadOS Updates

iOS and iPadOS applications must check for available updates where appropriate, but follow their distribution channel's installation restrictions.

**App Store builds**
- Check for new versions using an appropriate authorized mechanism.
- Show release notes when available.
- Direct users to the App Store for native application updates.
- Never attempt to install an unsigned IPA or bypass App Store restrictions.

**GitHub / sideloaded builds**
- Check the appropriate authorized GitHub release channel.
- Show the new version and release notes.
- Provide an installation or update action compatible with the application's actual distribution method, such as an approved alternative store or signing workflow.
- Do not claim direct IPA installation is possible when it requires signing or an external installer.

### Expo OTA Updates

For React Native / Expo applications, support compatible over-the-air updates when they are enabled for the project.

- Use the installed SDK's supported `expo-updates` APIs.
- Only deliver OTA updates compatible with the application's native runtime version.
- Distinguish JavaScript/assets updates from updates requiring a new native binary.
- Never attempt to apply native dependency or entitlement changes through OTA.
- Preserve rollback or recovery mechanisms.
- Respect release channels and store policies.
- Keep OTA update metadata consistent with the visible changelog.

GitHub Actions may coordinate OTA publication, but the update delivery mechanism must be compatible with the chosen runtime and infrastructure.

### Update Notifications and Release Notes

**Every update prompt must show what changed before the user decides to download or install it.**

Use the same visual language as the application's What's New system.

For major features:

- Show a descriptive icon beside each change.
- Use concise, user-friendly descriptions.
- Prioritize the most important additions.
- Avoid displaying raw Conventional Commit messages to normal users.

Group minor changes under **Fixes & Improvements**.

Place lengthy technical explanations behind expandable information controls.

The update interface should provide:

- New version number.
- Major-feature highlights with icons.
- Fixes & Improvements summary.
- Full Changelog action.
- Download size when available.
- Update Now action.
- Later action when the update is optional.

During download, keep the release notes accessible rather than replacing them entirely with a progress indicator.

After installation, integrate the update with the existing post-update What's New popup and permanent changelog.

Do not display duplicate or contradictory update notifications.

### Update Preferences

Add an **Updates** section to Settings containing:

- Current application version.
- Current release channel.
- Last successful update check.
- Update availability status.
- Check for Updates action.
- Automatic update-check preference.
- Automatic download preference where supported.
- Wi-Fi-only download preference where useful.
- View Latest Release Notes action.
- Full Changelog action.

The normal default should be automatic update checks with user-controlled installation.

Do not silently download large update packages over metered networks without respecting the user's configured preferences.

### Critical Updates

Support the ability to mark releases as security-critical or requiring special attention.

- Clearly distinguish critical security updates from ordinary feature releases.
- Allow stronger update reminders when justified.
- Do not arbitrarily block application usage for routine updates.
- If a server genuinely requires a newer minimum compatible client version, provide a clear explanation and supported recovery path.
- Avoid falsely presenting ordinary releases as mandatory.

### GitHub Actions Integration

The release pipeline must generate or publish the metadata needed for update detection.

After a successful authorized release:

1. Build and validate all required platform artifacts.
2. Publish the GitHub release or prerelease.
3. Generate structured release metadata containing the version, build number, commit, channel, changelog, artifact URLs, sizes, checksums, and compatibility information.
4. Update the appropriate distribution manifests and external store sources.
5. Validate the published download URLs and metadata.
6. Ensure installed application versions can discover the new release.

Do not expose unreleased, incomplete, or failed build artifacts as available updates.

### Reliability and Security

- Verify the authenticity and integrity of downloaded updates.
- Preserve Android signing-key continuity.
- Reject incompatible packages and downgrades.
- Handle offline conditions gracefully.
- Cache the last valid update metadata without misrepresenting it as current.
- Prevent duplicate download or installation sessions.
- Avoid excessive update polling.
- Protect release credentials and authentication tokens.
- Never install or execute untrusted packages silently.
- Respect operating-system security requirements.

### Completion Requirements

Consider the update system complete when the relevant supported build variants can:

1. Detect a newer compatible release.
2. Display accurate, icon-based release notes.
3. Offer an appropriate update action.
4. Download updates internally for directly distributed Android APKs.
5. Initiate the official Android installation flow when applicable.
6. Preserve existing application data.
7. Handle failures and interrupted downloads.
8. Verify or accurately report the installation result.
9. Integrate the installed update with What's New and version history.

Test the update process using real release artifacts when possible.

Clearly distinguish simulated update testing from successful physical-device installation testing.

**The objective is a seamless, secure update experience in which users can discover new versions, understand what's changed, and update through their application's supported distribution method—without manually navigating GitHub whenever direct in-app updating is technically supported.**

## 32. Mandatory Progressive Web App (PWA) Support

**EVERY website, web application, and React Native / Expo Web application must be configured as a fully functional, installable Progressive Web App (PWA).**

PWA support is a default requirement, not an optional enhancement.

### PWA Configuration

Every applicable web project must include:

- A complete Web App Manifest (`manifest.webmanifest`).
- Proper application name, short name, description, and unique identity.
- A configured Service Worker.
- HTTPS compatibility.
- Installable application metadata.
- Standalone display support.
- Appropriate `start_url`, scope, display mode, theme colors, and background colors.
- Proper icons in all required dimensions.
- Maskable application icons.
- Apple Touch Icons.
- Browser favicons.
- App shortcuts where useful.
- Application screenshots for supported installation interfaces when available.
- Responsive layouts for mobile, tablet, and desktop.

### Offline and Caching

Implement appropriate offline functionality.

- Cache essential static assets.
- Support offline navigation where technically feasible.
- Provide a polished offline fallback when network access is required.
- Use appropriate caching strategies for different resources.
- Version caches and remove obsolete ones.
- Prevent outdated cached content from breaking application updates.
- Never indiscriminately cache sensitive user data, credentials, or private API responses.
- Preserve user-created data during temporary network outages where practical.
- Support offline queues and synchronization recovery when relevant.

### PWA Updates

Integrate the Service Worker update lifecycle with the application's existing update and changelog system.

- Detect new web application versions.
- Notify users when a new version is available.
- Show release notes with descriptive icons.
- Offer an Update or Reload action.
- Apply updates safely without losing unsaved work.
- Avoid disruptive automatic reloads.
- Handle outdated caches and incompatible versions correctly.

Where applicable, use the same GitHub-generated structured release metadata used by native applications.

### Native-Like Web Experience

Installed PWAs should provide an application-like experience.

Support, where appropriate:

- Standalone window appearance.
- Responsive application navigation.
- Correct safe-area handling.
- Touch gestures.
- Keyboard shortcuts.
- Share Target and Web Share APIs.
- File handling.
- Badging.
- Notifications and push subscriptions.
- Background synchronization where supported.
- Deep links and URL handling.
- Device-specific capabilities through supported Web APIs.

Use feature detection and appropriate fallbacks for unsupported APIs.

Do not claim browser features work on every platform when support differs.

### Expo and React Native Web

When using Expo Web:

- Integrate PWA support into the existing Expo architecture.
- Ensure the exported web application includes the required manifest, icons, and Service Worker.
- Maintain compatibility with Expo Router and the installed Expo SDK.
- Verify that the production export works independently of the development server.
- Avoid caching strategies that interfere with routing, authentication, or application updates.

### PWA Validation

Verify:

- Installability.
- Manifest correctness.
- Service Worker registration.
- Offline behavior.
- Responsive layouts.
- Android browser installation.
- iOS/iPadOS Add to Home Screen behavior.
- Desktop browser installation where supported.
- Application updates.
- Cache recovery.
- Navigation and deep links.

Use browser auditing tools such as Lighthouse where useful, but supplement automated checks with actual platform testing.

Document unsupported features and platform limitations.

**Every applicable website must be designed as a web application that can also be installed, rather than merely a website with a manifest attached.**

---

## 33. Original Application Identity, Branding, and Layered Icons

**EVERY new application must have its own original name, visual identity, and professionally designed branding.**

Do not use generic placeholder names or reuse the identity of unrelated applications.

### Application Naming

Unless I explicitly provide a name or request otherwise:

1. Analyze the application's purpose, audience, functionality, and personality.
2. Generate original, memorable name candidates.
3. Prefer short, recognizable, easily pronounced names.
4. Avoid generic combinations of common application terms.
5. Research whether candidates are already used by applications, companies, or established software projects.
6. Check relevant app stores, GitHub repositories, search results, and trademark sources where possible.
7. Select the strongest reasonably available candidate.
8. Explain briefly why the name fits the application.

Avoid names that are confusingly similar to existing products or potentially infringe trademarks.

Do not claim a name is globally unused or legally cleared unless sufficiently verified.

If I have already chosen an application name, preserve it unless I authorize a change.

### Complete Visual Identity

Create a consistent application identity, including:

- Application name.
- Logo and application icon.
- Primary and secondary brand colors.
- Accent colors.
- Typography recommendations.
- Visual design language.
- Iconographic style.
- Splash screen.
- Repository banner.
- README branding.
- Social/share preview assets where applicable.
- PWA and native application branding.
- Light and dark theme variants.

Maintain consistency between application interfaces, documentation, GitHub repositories, and distribution channels.

### Mandatory Layered Icons and SVG Assets

**ALWAYS create layered, editable vector source assets for application icons and logos.**

Do not rely exclusively on flattened PNG or JPEG files.

Create an SVG master asset with logically separated elements, such as:

- Background.
- Primary symbol.
- Secondary shapes.
- Highlights.
- Shadows.
- Decorative details.
- Theme-dependent elements.

Use clean, editable SVG structures with meaningful groups, stable layer identifiers, and reusable definitions.

Keep source assets organized in a dedicated branding or assets directory.

Preserve original editable files rather than only storing exported assets.

### Theme-Aware Icons

Design icons to support:

- Light mode.
- Dark mode.
- Monochrome appearance.
- Tinted appearance where supported.
- Platform-specific adaptive icons.
- Alternate themes and accent colors.
- Different backgrounds and icon masks.

Do not flatten layers prematurely.

Where supported, allow theme-dependent backgrounds, foregrounds, and symbol colors to be modified independently.

### Platform-Specific Exports

Generate appropriate assets from the layered master design.

**iOS and iPadOS**
- App icon assets for supported platform requirements.
- Appropriate layered icon assets for supported Liquid Glass and appearance workflows.
- Light, dark, and tinted variants where applicable.
- Correctly sized and validated raster exports.
- Required asset catalogs.

**Android**
- Adaptive icon foreground.
- Adaptive icon background.
- Monochrome themed icon.
- Compatible launcher icon assets.
- Appropriate safe zones and masking behavior.

**Web and PWA**
- SVG logo and icons.
- Browser favicons.
- Apple Touch Icon.
- Standard PWA icons, including 192×192 and 512×512 where applicable.
- Maskable PWA icons.
- Theme-compatible application assets.

**Desktop**
- Appropriate macOS and Windows icon formats.
- Required icon resolutions.
- High-resolution assets and platform-specific variants.

Only create assets relevant to the application's actual supported platforms.

### Icon Design Quality

- Prefer clean, recognizable shapes.
- Ensure icons remain identifiable at small sizes.
- Avoid excessive detail.
- Maintain appropriate contrast.
- Respect platform masking and safe-area requirements.
- Avoid copyrighted or trademarked artwork without authorization.
- Ensure layered SVGs render correctly.
- Validate generated platform assets.
- Keep exports reproducible from their source files.

The icon should remain visually coherent across themes without requiring a complete redesign.

### Branding Documentation

Document the application's identity in `docs/BRANDING.md`, including:

- Name and naming rationale.
- Brand colors and their exact values.
- Typography.
- Icon construction.
- SVG layer structure.
- Theme variants.
- Exported asset formats.
- Asset generation instructions.
- Usage guidelines.

The objective is to create a recognizable, independent application identity that can evolve without rebuilding its assets from scratch.

---

## 34. Automatic Cleanup of Temporary Branches and Worktrees

**Always clean up temporary development branches and Git worktrees when they are no longer needed.**

Temporary branches are encouraged for experiments, isolated fixes, and parallel development, but they must not accumulate unnecessarily.

### Cleanup Requirements

After completing and integrating a development task:

1. Identify temporary branches and worktrees created for the task.
2. Verify that completed changes have been integrated into `testing`.
3. Confirm that no required commits remain unmerged.
4. Confirm that no associated pull requests or development tasks are still active.
5. Remove obsolete local temporary branches.
6. Remove corresponding obsolete remote branches where authorized and appropriate.
7. Remove unused Git worktrees.
8. Prune stale remote-tracking references when safe.
9. Verify that the repository and remaining worktrees are healthy.

### Protected Branches

**NEVER automatically delete:**

- `testing`
- `beta`
- `main`
- Protected release branches.
- Branches belonging to active pull requests.
- Branches containing unmerged changes.
- Branches belonging to another developer or ongoing task.
- Branches associated with worktrees containing uncommitted changes.

Do not delete user-created branches simply because they appear old.

### Safe Cleanup

- Prefer Git's safe branch deletion mechanisms.
- Verify integration before deleting.
- Avoid force deletion unless explicitly authorized and demonstrably safe.
- Do not discard uncommitted changes.
- Do not remove worktrees that are currently being used.
- Preserve repository history and recovery options.

For experimental branches that were intentionally abandoned, request confirmation before deleting unmerged work.

### Final Reporting

At task completion, include a brief Git cleanup summary when relevant:

- Temporary branches merged.
- Local branches removed.
- Remote branches removed.
- Worktrees cleaned.
- Branches intentionally preserved.

**The goal is to leave the repository clean and organized while preserving all valuable, unfinished, or user-owned work.**

## 35. Developer Ideas, Improvements, and Fix Tracking

**Every application must include a persistent Ideas system within Developer Options, tightly integrated with the application's changelog, development workflow, and AI coding agents.**

The objective is to allow developers to record feature ideas, improvements, bugs, and observations directly while using an application, even when Codex or another development environment is unavailable.

These ideas must be preserved, easily transferable, automatically discoverable during future development sessions, and traceable through implementation and release.

### Ideas Page

Add a dedicated **Ideas** page within the existing Developer Options system.

The interface must support:

- Creating ideas at any time.
- Editing, deleting, duplicating, and organizing existing ideas.
- Recording feature requests, improvements, bug reports, and technical observations.
- Adding titles, detailed descriptions, and optional reproduction steps.
- Assigning categories such as **Feature**, **Improvement**, **Bug Fix**, **UI/UX**, **Performance**, or **Other**.
- Assigning optional priorities.
- Automatically recording creation and modification timestamps.
- Tracking implementation status.
- Searching, filtering, and sorting ideas.
- Selecting multiple ideas for batch operations.
- Copying or sharing individual ideas.
- Exporting and importing the complete ideas collection.

Use a clean, polished interface with descriptive category icons, concise previews, expandable details, and clear status indicators.

### Idea Status and Lifecycle

Each idea must support the following statuses:

- **Pending** — Recorded but not yet reviewed.
- **Approved** — Selected for future implementation.
- **Deferred** — Intentionally postponed.
- **In Progress** — Currently being implemented.
- **Implemented** — Completed and verified.
- **Rejected** — Explicitly dismissed or deemed unnecessary.

Preserve ideas and their history when statuses change.

Allow ideas to be reopened, reprioritized, or moved between statuses.

Never mark an idea as implemented merely because development has started or code has been generated.

### Local-First Persistence

**Ideas must work completely offline and survive application restarts, crashes, and updates.**

- Use reliable persistent application storage.
- Assign stable, unique identifiers to ideas.
- Preserve descriptions, timestamps, categories, priorities, and statuses.
- Avoid accidental duplication or data loss.
- Support safe storage migrations.
- Keep the system independent of external services.
- Never delete recorded ideas during ordinary application updates.
- Keep the underlying data model reusable across platforms.

Do not require an internet connection, GitHub authentication, or an active development environment to record ideas.

### Export and Import

**Every application's Ideas page must provide straightforward, portable export and import functionality.**

Use a standardized, versioned JSON format as the primary interchange format.

Each export should contain:

- Schema version.
- Application and project identifier.
- Export timestamp.
- Idea identifiers.
- Titles and descriptions.
- Categories and priorities.
- Creation and modification timestamps.
- Current statuses.
- Optional implementation references.
- Relevant metadata.

Also support human-readable Markdown export where practical.

Import functionality must:

- Validate file structure and schema versions.
- Support compatible exports from previous application versions.
- Detect duplicate ideas using stable identifiers.
- Provide safe merge and conflict-resolution behavior.
- Preserve existing entries by default.
- Allow reviewing incoming changes before applying them.
- Never silently overwrite or delete existing ideas.
- Report import results and errors clearly.

Use native share sheets, file pickers, and platform-appropriate import/export interfaces.

### Repository and AI Agent Integration

**Every AI coding agent must check for outstanding recorded ideas when beginning a new development session or substantial application modification.**

Maintain a standardized project-level ideas file, preferably:

`docs/IDEAS.json`

Use `docs/IDEAS.md` as an optional human-readable companion.

Add instructions to `AGENTS.md` requiring coding agents to:

1. Locate and read the project's ideas collection during initial context retrieval.
2. Identify pending, approved, and deferred ideas.
3. Compare recorded ideas against existing application functionality.
4. Detect ideas already implemented but not yet marked as completed.
5. Present a concise summary of actionable ideas.
6. Ask whether to implement relevant ideas **now or another time**.
7. Allow selecting individual ideas or implementing several together.
8. Respect the user's decision without repeatedly interrupting the current task.
9. Preserve deferred and unselected ideas for future sessions.
10. Update idea statuses and implementation references as development progresses.

**The user must remain in control of which ideas are implemented.**

Do not automatically implement unrelated ideas merely because they were discovered.

Essential fixes required for the explicitly requested task remain governed by the existing autonomous development standards.

### Automatic Retrieval and Synchronization

Design the system so that transferring ideas from the running application to the development environment requires as little manual intervention as possible.

When authorized and technically supported:

- Synchronize ideas with the application's private development repository or another explicitly configured development source.
- Keep the standardized ideas file accessible to coding agents.
- Automatically retrieve available ideas when a development session begins.
- Support bidirectional synchronization where practical.
- Detect conflicts and preserve changes from multiple devices.
- Avoid unnecessary server infrastructure.
- Never expose private ideas through public repositories or release artifacts without authorization.

When direct synchronization is unavailable, provide a one-action export workflow that produces a file Codex can read or import into the repository.

**Do not assume that an AI agent can access an application's private on-device storage without an established synchronization, export, or authorized access mechanism.**

Never claim that automatic retrieval succeeded unless the actual ideas collection was successfully accessed.

### Changelog Integration

**The Ideas system must be directly connected to the mandatory What's New and Changelog standard.**

When an idea is implemented:

1. Associate it with the relevant commits, pull requests, or implementation changes.
2. Record the application version or build in which it becomes available.
3. Update its status only after appropriate implementation verification.
4. Include the completed feature or fix in the appropriate structured changelog metadata.
5. Generate suitable user-facing release notes.
6. Preserve the original idea and its implementation history.

Follow the existing changelog presentation requirements:

- Major completed features appear with descriptive icons.
- Minor fixes and optimizations appear under **Fixes & Improvements**.
- Technical details, commits, and associated idea identifiers remain accessible through the Developer Changelog.
- Pending, approved, deferred, and in-progress ideas must never appear as completed features in release notes.

Allow implemented ideas to link to their associated changelog entry when that release information is available.

### Developer Workflow

During an ordinary development session, an AI agent should be able to report:

- Number of pending ideas.
- Number of approved ideas.
- Number of deferred ideas.
- Newly recorded ideas since the previous review.
- Ideas potentially related to the current development task.
- Ideas that appear to have already been implemented.

For example:

**Example 1 — Feature Improvement**

An idea recorded in the application states:

"Add a battery percentage indicator beside the vehicle speed display."

During the next development session, the agent retrieves the idea and asks whether to implement it immediately or keep it for a future update.

After verified implementation, the idea is linked to its commit and appears under the appropriate release's major features.

**Example 2 — Bug Fix**

An idea states:

"The navigation back button sometimes disappears when a nested page is opened directly."

The agent identifies the relevant navigation issue, offers to fix it, and preserves the idea until the correction is verified.

Once completed, the idea is linked to the relevant commit and included in **Fixes & Improvements**.

### Architecture and Documentation

Implement the Ideas system as a reusable, modular component suitable for every application.

- Separate the UI, storage, import/export, synchronization, and agent-integration logic.
- Use shared schemas and strongly typed data models where supported.
- Avoid unnecessary dependencies.
- Support relevant application platforms.
- Document the feature in `docs/features/`.
- Document its storage schema, synchronization behavior, and export format.
- Keep `AGENTS.md` synchronized with the retrieval workflow.
- Add relevant tests for persistence, imports, exports, duplicate detection, and status transitions.
- Preserve compatibility with the existing Developer Options, changelog, and release infrastructure.

**The ultimate goal is to create a continuous feedback loop between using an application and developing it: capture ideas immediately, preserve them reliably, retrieve them during future coding sessions, implement them only when authorized, and track completed improvements through the application's changelog.**

## 36. Universal Platform, Infrastructure, Repository, and Interface Design Standards

**Every application must prioritize multiplatform compatibility, consistent hosting infrastructure, repository continuity, polished visual design, meaningful animations, and clear information hierarchy.**

### Mandatory Multiplatform Development

- **Use Expo and React Native by default for mobile applications.**
- Prefer frameworks that share application logic, UI components, and functionality across multiple operating systems.
- For desktop development, evaluate multiplatform frameworks such as React Native macOS/Windows, Tauri, and Electron.
- Prioritize code reuse between iOS, Android, web, and desktop.
- Preserve native platform functionality and conventions.
- Only choose a platform-specific framework when multiplatform solutions cannot adequately support essential requirements.
- Document technical exceptions without unnecessarily restricting supported platforms.
- Never rewrite an existing functioning application solely to change its framework without authorization.

### Mandatory Web Versions and Landing Pages

**Every application and service must have an accessible, functional web presence.**

- Provide a web version of every application, using Expo Web or another compatible framework where appropriate.
- Provide a web-based interface for services, including administration, monitoring, or user-facing functionality as appropriate.
- Implement functionality comparable to native applications wherever browser capabilities permit.
- Provide graceful fallbacks for hardware-specific or unsupported browser features.
- Follow the existing mandatory PWA requirements.

Every project must also include a dedicated, responsive landing page featuring:

- Original branding and application identity.
- Product description and primary features.
- Real screenshots or appropriate promotional assets.
- Supported platforms.
- Installation and download options.
- Documentation and relevant links.
- Privacy and licensing information where applicable.
- Clear navigation to the actual web application.

The landing page and functional web application must be distinguishable, even when served from the same domain.

Do not expose private applications, repositories, or services publicly without authorization.

### X-Center Hosting

**X-Center is the mandatory default hosting infrastructure for all applications, websites, APIs, databases, and backend services.**

- Deploy compatible services to X-Center.
- Prefer self-hosted infrastructure over unnecessary third-party hosting.
- Use appropriate isolation, networking, reverse proxies, TLS, monitoring, and access controls.
- Preserve existing healthy deployments and unrelated services.
- Use reproducible deployment configurations.
- Maintain reliable backups and rollback mechanisms.
- Do not install or modify major infrastructure components without appropriate authorization.
- Continue using GitHub Actions for builds and CI/CD, with deployment to X-Center where applicable.

If X-Center cannot support a required workload, report the limitation and obtain authorization before using alternative infrastructure.

### Existing Repository Identification and Reuse

**Never create a duplicate repository when an existing repository with the project's name already contains that project.**

When a repository with the requested project name already exists:

1. Inspect that repository's contents, documentation, history, and application structure.
2. Determine whether it belongs to the same project.
3. If confirmed, reuse the existing repository.
4. Preserve its history, branches, configuration, and existing functionality.
5. Integrate new work using its established development workflow.
6. If the contents belong to a different project, do not overwrite them.

**Do not proactively search for repositories with similar names or attempt to identify matching projects across unrelated repositories.**

Only perform the content verification when an existing repository matches the project's intended repository name.

If ownership or project identity remains ambiguous, do not modify the repository without confirmation.

### Hardware-Backed Git Commit Signing

**Prefer hardware-backed signing for Git commits whenever the configured signing key is available.**

When the hardware signing key is unavailable:

- Continue development normally.
- Create unsigned commits rather than blocking development.
- Push authorized development changes according to the existing Git workflow.
- Never substitute an unauthorized software signing key.
- Preserve the original commit contents and history.
- Clearly report that commits were created unsigned.

When the hardware signing key becomes available again:

1. Detect or verify that signing is functional.
2. Identify unsigned commits that could be re-signed.
3. Ask the user whether to perform an interactive rebase or another suitable history-rewriting operation to sign those commits.
4. Explain the effects on commit hashes, remote history, collaborators, and open pull requests.
5. Perform the operation only after authorization.
6. Verify the resulting signatures.
7. Update remote references safely and only when authorized.

Never automatically force-push rewritten history or bypass protected-branch policies.

### Universal Iconography

**Use meaningful, descriptive icons throughout application interfaces wherever they improve recognition, clarity, or visual organization.**

This applies to:

- Short and long information lists.
- Settings and configuration options.
- Navigation destinations.
- Feature descriptions.
- Status messages.
- Actions and controls.
- Menus and contextual actions.
- Changelogs and update dialogs.
- Empty states and informational panels.
- Cards, categories, and section summaries.

Long lists should use appropriate individual icons for entries when they improve scanning and distinguish the items.

Icons must:

- Match their associated meaning.
- Follow a consistent visual style.
- Maintain appropriate size, alignment, and spacing.
- Support light and dark themes.
- Preserve sufficient contrast.
- Include accessible text or labels.
- Avoid unnecessary decoration or visual noise.

### Contextual Information and Visual Hierarchy

**Every interface must clearly distinguish primary functionality from supporting information.**

Explanations, helper text, descriptions, instructions, and technical details must never appear as unstructured or visually misplaced content.

Use appropriate styling such as:

- Secondary typography and muted text.
- Clearly grouped sections.
- Descriptive headings and subtitles.
- Consistent spacing and alignment.
- Subtle background surfaces.
- Information panels or contextual cards.
- Dividers when useful.
- Appropriate information icons.

When explanatory text becomes sufficiently long to clutter an interactive interface, move the additional explanation behind an accessible information button, expandable section, or equivalent disclosure control.

**Do not use information buttons unnecessarily.**

For dedicated informational pages without interactive controls:

- Display informational content directly.
- Use readable headings, paragraphs, sections, and supporting visuals.
- Do not hide ordinary page content behind information buttons.
- Preserve natural document-style reading and scrolling.

The objective is to make information visually intentional, not to hide content indiscriminately.

### Text Contrast and Layout Integrity

**All text and supporting information must remain visually readable, properly grouped, and clearly associated with their intended interface elements.**

- Maintain accessible foreground/background contrast.
- Avoid low-opacity text that becomes unreadable.
- Ensure content remains legible over glass, blur, gradients, images, and translucent surfaces.
- Use appropriate backgrounds or contrast treatments behind floating content.
- Prevent disconnected text blocks from appearing randomly positioned.
- Clearly distinguish secondary information from interactive controls and primary content.
- Validate appearance in light mode, dark mode, and supported accessibility settings.
- Test responsive layouts across different screen sizes and text scales.
- Preserve visual hierarchy and alignment during animations and transitions.

### Mandatory Design Skills and Apple Design Principles

**Always consult and apply relevant available professional UI/UX, Apple design, interface animation, motion-design, and accessibility skills during application development.**

Before implementing or substantially modifying an interface:

1. Identify relevant installed design and animation skills.
2. Read and apply their instructions when available.
3. Follow Apple's Human Interface Guidelines for Apple-platform applications.
4. Use appropriate modern Apple design patterns, including Liquid Glass where supported.
5. Follow native Android, web, and desktop conventions where they differ.
6. Apply consistent spacing, typography, hierarchy, materials, and interactions.
7. Review the result for visual quality, accessibility, and platform compatibility.

Do not ignore applicable design skills merely because an interface is technically functional.

When a required specialized skill is unavailable, follow established platform design guidance and report the limitation where relevant.

### Mandatory Animation and Motion Design

**Animations are mandatory throughout every application wherever motion meaningfully improves the user experience.**

Every application must implement a coherent motion-design system.

Use appropriate animations for:

- Screen and navigation transitions.
- Modal, sheet, and dialog presentation.
- Buttons and interactive controls.
- State changes and selection.
- Expandable and collapsible content.
- Loading and progress indicators.
- Success, error, and confirmation feedback.
- List insertions, removals, and reordering.
- Gesture-driven interactions.
- Contextual menus and overlays.
- Relevant visual transitions between application states.

Animation requirements:

- Prefer smooth, natural, platform-appropriate motion.
- Use consistent duration, easing, and spring parameters.
- Maintain responsive interactions.
- Avoid unnecessary delays.
- Prefer performant native or GPU-accelerated animations.
- Prevent flickering, layout jumps, and abrupt visual changes.
- Avoid excessive animations that distract from functionality.
- Respect Reduced Motion and equivalent accessibility settings.
- Provide accessible, less animated alternatives where required.
- Test animation quality on intended platforms, not only web.

Use relevant available animation and design skills to guide implementation.

**Animation must be intentional and functional, never an excuse for unnecessary visual complexity.**

### Final Design Principle

Every application must feel professionally designed rather than merely functional.

Prioritize multiplatform accessibility, polished native interactions, consistent branding, meaningful icons, readable information hierarchy, thoughtful animations, and reliable self-hosted infrastructure.

**The goal is a unified, maintainable development ecosystem in which applications share professional standards without sacrificing their individual identities or native platform quality.**
