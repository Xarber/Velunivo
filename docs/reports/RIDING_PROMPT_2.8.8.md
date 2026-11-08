# Riding prompt alignment — 2.8.8

## Scope and implementation

User reports that 2.8.7 works, but its expanded icon is oversized/offset, the title briefly shifts, and the lock button has an inconsistent taller rounded background. This is user-reported physical evidence, not an agent device test.

The riding prompt previously placed a 32-point vehicle icon in expandedLeading and the title/actions separately in expandedBottom. The new prompt uses a single leading-aligned content group in expandedBottom: an 18-point vehicle symbol in a stable 24-point frame beside the title. expandedLeading is empty. This removes the separate icon region as an alignment dependency; the transient initial text movement has not been reproduced or verified fixed on a device. Compact/minimal symbols use 16 points and compactTrailing is empty, replacing the question mark. The JS fallback matches the same empty regions and inline heading.

All three actions have a 32-point outer height. Start recording retains its accent fill and play symbol with a small native control size. Find destination and lock/unlock both use plain accent styling: the lock no longer has a background or a rounded container. Existing intent identities, lock safety/staleness, vehicle category selection, foreground/background lifecycle, and other activity layouts are unchanged. No permissions, dependencies or Bluetooth protocol code changed.

Relevant platform reference: [Apple DynamicIslandExpandedRegion](https://developer.apple.com/documentation/widgetkit/dynamicislandexpandedregion). The professional design/Swift review is limited to this prompt, not an application-wide audit.

## Validation

Lint, TypeScript, Swift syntax parsing and guarded widget patch passed. JavaScript: 564 tests passed, including the empty trailing/leading regions, inline scooter header, isolated preview and existing recording/navigation lifecycle checks. Python: 59 tests passed. Version history and translated release text updated to 2.8.8.

No simulator, local native build or physical device test was performed. Native compilation and actual Dynamic Island alignment/fit remain release/device gates. Existing user confirmation that 2.8.7 works does not prove 2.8.8 layout correctness. The 2.8.7 stable workflow completed successfully before this update.

## Publication

Use the established unsigned development → testing → main promotion, mandatory stable builds and automatic AltSource publication. Update the matching hosted web with rollback and health/handshake validation; record actual submission/deployment below.
