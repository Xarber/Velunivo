# Reversible UI refinements — 2.3.1

The only experimental redesign is the expanded vehicle telemetry dashboard: compact metric icons, smaller labels, larger values and a subtle outline. No navigation, recording, pairing, visibility, sensor or storage behavior is controlled by this switch.

It is on by default. There is **no user-facing Settings switch**, so nothing new appears outside Developer Options. A build-time flag is sufficient for rollback:

- Local web export: `EXPO_PUBLIC_UI_REFINEMENTS=0 npx expo export --platform web`.
- GitHub builds: set repository variable `VELUNIVO_UI_REFINEMENTS` to `0`, then build a fresh patch version. Reset it to `1` to restore the refinement.
- Alternatively revert the isolated `style(ui)` commit; functional optimizations and scratch replay remain intact.

The replay panel also corrects an existing contrast problem: expanded glass is dark even in light appearance, so its text and nested controls use a matching dark palette. This is an accessibility correction, separate from the experimental dashboard styling.

Scratch replay and its preview toggle are requested functionality. Its overlay does not alter saved exploration history. Animation is isolated in leaf components, stops in the background, and respects Reduce Motion. The replay preview uses a temporary historical map; it can be hidden with the Scratch map button.
