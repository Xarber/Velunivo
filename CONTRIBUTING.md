# Contributing to Velunivo

Start with [AGENTS.md](AGENTS.md), [setup](docs/SETUP.md) and [architecture](docs/ARCHITECTURE.md). Use the Node/npm versions and lockfile documented in setup. Check the Expo SDK 57 documentation before changing native APIs. Native folders are generated; configure them through app config/plugins.

Keep commits descriptive and conventional, for example `feat: Add saved destinations` or `fix: Preserve route overview padding`. Release notes group multiple commits by type. Commits and tags remain unsigned in this project; use `git -c commit.gpgsign=false commit --no-gpg-sign` without changing global security-key settings.

Run `npm run lint`, `npm run typecheck` and meaningful tests for changed behaviour. Record changes and observed test evidence in `docs/WORKLOG.md` and `docs/VERIFICATION.md`. Clearly separate web/Simulator evidence from physical-device testing.

For bug reports, include platform, app version, steps, expected/observed result and a redacted screenshot if useful. Do not publish private GPX tracks, home/work addresses, GPS recordings, provider keys, signing credentials or personal logs. Reproduce routing issues with public landmarks when possible.

Builds use GitHub Actions, not EAS. Do not download local SDKs without explicit authorization. Do not relax road restrictions to hide provider failures or manufacture routes, street limits, turn instructions, battery readings or traffic forecasts.
