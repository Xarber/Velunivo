# Apple design and motion review — 2.7.0

Reviewed after pushing candidate `a6512df` to testing, using Apple Design, Animate Expo and Review Animations. This is an audit, not an unrelated visual redesign. Coverage: the 34 route files, shared map/toolbar/sheet/button/field components, planner, recording, Library/replay/Memories, vehicle forms, settings/developer/onboarding and transfer flows. Source inspection was paired with Chromium/WebKit interaction checks. Native release Simulator checks are recorded separately; no low-end physical-device motion certification is implied.

## Findings

| Before | After (recommended; not silently implemented) | Why |
| --- | --- | --- |
| `WebMotion.web.tsx:22` animates sheet height for 360 ms. | Remove the height transition; retain a short opacity/transform response or use a transform-based measured sheet. Use the documented drawer curve `cubic-bezier(0.32,0.72,0,1)` and keep ordinary UI below 300 ms. | Height forces layout while maps render; the cheap compositor alternative avoids this. Motion review blocker. |
| `WebMotion.web.tsx:26` uses `ease-in` when dismissing the planner. | Use `cubic-bezier(0.23,1,0.32,1)` for the 200 ms exit, keeping the same spatial path. | The initial response should be immediate. Motion review blocker. |
| `ReorderRows.tsx:9,19` uses PanResponder and React state on every drag update. | Move continuous translation to Gesture.Pan + shared values/UI-thread style; commit row order only on release, retaining adjustable accessibility actions. | Route-field dragging crosses the JS runtime and competes with search/map work. Motion review blocker on busy/low-end devices. |
| `SwipeArea.tsx:7` changes sheet state only at release and uses a distance-only threshold. | Prefer native detents when feasible; otherwise track the finger on the UI thread and settle using both release velocity and distance, with a 300 ms / dampingRatio .8 spring. | A fast small flick is currently ignored; the panel does not physically follow the finger. |
| `MotionView.tsx:11` applies a 320 ms layout transition to general in-flow surfaces. | Limit layout animation to a demonstrated spatial need; remove it from frequent changes. Use transform/opacity and keep normal UI under 300 ms. | A blanket layout animation couples otherwise independent child changes. Absolute map panels already correctly skip this path. |
| `PressMotion.tsx:7` starts core Animated springs from JS, with the same response on press and release. | For a future shared-control pass, use a 100–150 ms Reanimated CSS press response (scale .97), a faster release and system reduced motion. | Native-driver transforms are already preferable to per-frame JS state, but starting the response still waits for JS. Avoid a broad migration in this release. |
| `useScratchGlow.ts:14` limits paint updates to about 33 Hz, though the reveal ends after 720 ms. | Keep the short, finite reveal; profile the map renderer before raising the cadence. Prefer renderer/UI paint animation rather than rebuilding geometry or a parent React map. | This is a known smoothness limit, not proof of a low-end frame-rate regression. Current code correctly leaves geometry stable and cancels in background/reduced motion. |
| `GlassSurface.tsx:21–24` can stack a BlurView with GlassView, or two BlurViews on older iOS. | In a separately reversible performance change, retain one material layer per surface and compare contrast in both appearances. | Multiple live material passes over a moving map can be costly. Measure GPU cost before changing visual hierarchy. |
| `MemoryReplay.tsx:10` uses a fixed 390 pt panel and percentage height caps. | Validate largest Dynamic Type, landscape keyboard/accessibility and media sizing; prefer a measured header plus scrollable content, with one media surface. | The synchronized playback and one-WebView design reduce process overhead, but a passing default-size browser test is not a full Dynamic Type pass. |

## Verdict by impact

**Feel-breaking regressions:** remove planner exit ease-in; move drag tracking off React/JS before describing motion as fully polished.

**Performance:** the CSS sheet-height transition has an easy compositor alternative; blanket layout transitions and duplicate materials deserve targeted measurement. The finite scratch paint effect is isolated, but currently capped around 33 Hz.

**Interruptibility and timing:** row reordering and swipe-to-expand need continuous gesture handling and velocity handoff. Keep native stack/tab transitions; do not add decorative animation to navigation or settings toggles.

**Accessibility:** reduced-motion subscriptions and web hover capability gates exist. Minimum shared control targets are 44 pt; the replay scrubber is a real platform slider. A complete large-text and slowest-supported-Android pass remains required. Do not equate Simulator results with physical gesture/haptic verification.

**Decision: Block motion-polish approval.** The feature build can be tested independently, but the sheet-height, ease-in and JS-driven drag findings prevent an honest blanket motion approval. Recommendations above are intentionally review-only, so they do not make this release an unrequested redesign.

## Improvements verified in this change

- Flexible vehicle text/battery columns, compact provenance labels and native slider semantics.
- Shared badge artwork across map/list; independent stale-location opacity snapshots avoid a full map rerender on every clock tick.
- Bounded large-screen Library tiles, increased Duo margins, modal-local direction safe area and compact horizontal landscape tools.
- Native arrow rotation follows actual camera callbacks; no per-frame React arrow rotation is required on MapKit.
- One shared Memories media clock and one native WebView, rather than a browser process per rider.

## References

- Apple: [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [UITabAccessory](https://developer.apple.com/documentation/uikit/uitabaccessory), [adaptive tab/sidebar controls](https://developer.apple.com/documentation/uikit/elevating-your-ipad-app-with-a-tab-bar-and-sidebar).
- Local review standards: `/Users/xarber/.codex/skills/review-animations/STANDARDS.md`; construction guidance: `/Users/xarber/.codex/skills/animate-expo/SKILL.md`; design guidance: `/Users/xarber/.codex/skills/apple-design/SKILL.md`.
