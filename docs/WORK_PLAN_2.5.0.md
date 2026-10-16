# 2.5.0 work plan — 16 October 2026

Screenshot reliability is the first priority. User authorizes one local development build, at most one booted Simulator, iPhone 17 Pro real iFrames mockup; preserve user simulators. All commits/tags unsigned. Native capture must use actual native framebuffers. No screenshot failures block binary releases.

- [ ] Android17 tools22 must replace latest directory because emulator action prepends it; verify phone and tablet captures.
- [ ] iOS27 / iPadOS27 CI capture; iPhone17 Pro; actual transparent iFrames assets in welcome tour.
- [ ] Explain actual notifications; theme all accent elements including scratch/map/buttons/logo, alternate native icons.
- [ ] Preserve valid telemetry across empty updates; charging protocol verification.
- [ ] Rename paired devices; fix simultaneous waiting/manual sync race and discovery latency.
- [ ] iPad/fold safe areas, centered map controls, light/dark panels.
- [ ] More cosmetic XP rewards; daily15 / weekly70 tiles; report neighborhood distance.
- [ ] Debug Logs (not launch logs), developer opt-in, one-week retention, useful redacted BLE diagnostics.
- [ ] development no workflows; testing prerelease; main stable; stable-only automatic gallery/source pipeline.
- [ ] Memories: consent/opt-out per participant, received audio/location and optional video recording; visible recording indicator and storage accounting. Never silently record nonconsenting peers.
- [ ] Developer-only complete changelog and historical entries; all locales, tests, native QA, matching hosted web update.

2.4.0 native/web release succeeded in run38893167584. Root Android17 finding: reactivecircus action prepends cmdline-tools/latest/bin after our PATH update, so actual avdmanager was still preinstalled and wrote invalid Major.Minor AVD metadata. Explicit tools22 replaced in disposable runner only. Reference https://github.com/actions/runner-images/issues/14484.
