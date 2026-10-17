# Velunivo 2.6.0 testing update

## Native map, activity and input fixes

The supplied 2.5.2 Duo crash terminates in UIKit hierarchy validation while the appearance module inserts its custom sidebar hosting view. That window-level hosting controller has been removed. Planning controls use Expo Router's supported NativeTabs.BottomAccessory with SwiftUI buttons; Search is first. Active navigation/recording hides the main tabs, keeps native floating map controls and adds Settings, with a Back to navigation action in Settings. Other platforms retain functional map controls. No private UIKit sidebar injection remains.

Native navigation arrows use asset-backed MapKit markers and MapLibre symbols rather than relying on native snapshots of a changing React image. Assets have explicit display scales. Group pins keep a non-collapsible photo/initials layer beneath camera video; video appears only after it has renderable dimensions/data. Web markers retain MapLibre's absolute positioning. A profile refresh without a foreground GPS fix preserves the last published group location.

Landscape phone follow padding reserves the left controls and centers the camera in the available right side. Expanded ride controls can cover directions. Directions and edited single-field sheets support landscape. Main Library uses physical safe areas and a themed background. A shared keyboard boundary adds a dismiss action; single-field sheets autofocus. These changes require native visual validation, especially Duo resizing and MapKit marker rotation.

Milestone badges follow No badge and use achievement/level requirements. Developer reward previews remain local and temporary.

## Transfer progress and convergence

One progress range covers outgoing data (0–50%) and return data (50–100%). Each importing phase explicitly says Applying settings and uses indeterminate progress. Overwrite uses 0–100%. A backward-compatible applying packet informs the sender while the receiver commits data. The idle digest includes scratch/exploration progress, ignores export time and association insertion order, and is recalculated after import before comparing peer state. Original edit timestamps remain intact. Completion refreshes the digest and starts the retry cooldown.

## Battery planning and telemetry display

Live validated reading timestamps advance the telemetry display clock, preventing fresh packets from temporarily appearing to come from the future. Partial updates retain previous good readings and eventually mark them old. No synthetic zero or placeholder is inserted over a valid reading.

Battery planning can use the most recent real vehicle reading, reduced by five percentage points per elapsed day. After three days it falls back to the configured assumed charge. The feature can be disabled. A fresh connected reading takes priority. Prior recording summaries can seed the cache without rewriting original samples. Exploration candidate cards and energy warnings now reference the selected exploration geometry.

## Advanced analytics

See TELEMETRY_EXPANSION.md for the feasibility contract. Existing recorded rides are analyzed lazily from their original timestamped samples; no duplicate recorder, dependency, controller polling or firmware writes were added. New optional fields remain compatible with older records.

Recorded rides expose Overview, Performance, Electrical, Battery & temperature, Diagnostics and Compare. Shared chart cursors select corresponding route positions. Vehicle performance adds date-filtered historical charts, loaded in batches. The expanded telemetry dashboard has configurable live energy widgets. Visibility stays separate from collection.

Electrical integration splits discharge and regeneration, rejects stale/misaligned endpoints, charging, backwards/duplicate timestamps, explicit breaks and intervals over six seconds. Consumption/recovery/net Wh are observations over covered intervals. Wh/km requires at least 80% electrical and GPS coverage. Speed distributions are time-weighted. Calibration needs precise GPS and sufficient overlap. Voltage sag is an observed acceleration/load event, never a diagnosis of battery degradation. Historical efficiency comparisons require matched speed, limits, observed modes and available elevation; unknown elevation is disclosed.

Optional tire diameter is reference metadata only. Current protocols do not expose verified motor RPM, phase/torque current, field weakening, controller limits or motor/controller temperature. Those remain unsupported. Usable battery energy is not invented from nominal capacity. Historical charts are observational, not causal claims about battery health or the source of a slowdown.

## Validation and limits

No native compilation, SDK installation, simulator boot or interaction with the user's browser is performed. Automated unit tests, Swift syntax parsing and isolated Chromium checks are reported separately from physical testing. Native arrows/pins, fold/landscape safe areas, keyboard behavior, real Bluetooth electrical data, background sync and Memories still need device testing. Existing CallKit/media lifecycle behavior is intentionally untouched.

### Completed short validation

- Expo lint and TypeScript passed.
- 454 JavaScript/TypeScript tests passed (bounded local concurrency), including integration math, gap/charging rejection, retained group positions, deterministic sync ordering and all six language dictionaries.
- 49 Python workflow, screenshot-fallback and release tests passed.
- Swift syntax parsing passed for the reduced appearance module. No native binary was compiled locally.
- Fresh isolated Chromium: Search opens the planner; a synthetic two-minute 120 W recording displays 4.0 Wh; chart selection exposes the shared route cursor; scatter charts and narrow viewport render without JS exceptions or horizontal page overflow. Synthetic data is a mathematical/UI fixture, not physical scooter validation.
- One earlier full run overloaded the standalone test's five-second startup window; its isolated rerun passed and the complete bounded-concurrency run passed unchanged. A new-version changelog fixture was updated to include 2.6.0.

The final release-history check also found that the developer-note generator ignored prerelease tags, which could hide 2.5.1/2.5.2 developer history and repeat those commits under 2.6.0. It now selects the latest testing build per version (or the stable tag), retains untagged historical notes and bounds each version to its preceding release. A temporary-repository regression test covers these cases.

### MapKit marker rotation follow-up

Review of the installed react-native-maps source confirmed that the Apple MapKit marker manager never exports the public rotation property. The existing version-checked postinstall patch now exports it and rotates the annotation view using heading minus camera bearing. Other markers default to zero rotation. A finite-value guard avoids invalid transforms. The patch is idempotent and does not alter Android or Google Maps. Native compilation is delegated to CI; the patch regression test passes locally.
