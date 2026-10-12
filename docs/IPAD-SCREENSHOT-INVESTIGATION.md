# iPad screenshot and build duration investigation

Scope: screenshot automation and build efficiency only; no application features or local native compilation.

## Evidence from release run 38207740453 (1.0.2)

- iPad boot completed, but both app installs exceeded the 60-second limit. The capture step exhausted its eight-minute budget, including diagnostic/cleanup commands on an unresponsive host. Runner inventory reports only 3 CPUs and 7 GB RAM; large simulated devices amplify resource pressure.
- iPhone also failed fresh verification. Both published images were historical fallbacks from v1.0.0; a successful release job is not proof of a fresh screenshot.
- The script looked exclusively for Simulator.app. Xcode 27 uses Device Hub, whose documented rotation menu is Controls > Rotate Left. The old Device > Orientation > Landscape Left path cannot work there.
- Native iOS archive: 12m39s. Simulator build: 13m42s, previously run serially after the archive. Android build: 27m07s. Overall release: about 41 minutes.
- React Native did enable its ccache wrapper, but Xcode compiler subprocesses did not receive CCACHE_DIR. The configured cache path never existed at save time, and reported cache size was zero.

## Changes under validation

- Recognize Device Hub in Contents/Applications (not Contents/Developer/Applications). Prefer Xcode 27 devicectl device orientation set for headless landscape rotation; retain GUI fallback for older toolchains and verify landscape PNG dimensions. The exact CLI syntax was checked against the installed Xcode beta help.
- Allow 90 seconds for app installation, with two complete bounded attempts and historical fallback preserved.
- Run iPhone and Simulator compilation in independent jobs. Screenshot verification can begin as soon as the Simulator build finishes, while Android/device builds continue.
- Pass compiler cache configuration as Xcode build settings, preserving it in compiler subprocesses. Separate device and Simulator cache namespaces; retain a 2 GB bounded cache for each.
- Use available hosted Linux CPUs for Gradle workers, retaining all supported Android ABIs.
- Add a screenshot-only diagnostic workflow which consumes an existing compiled artifact: no binary release or compilation required to debug capture.

Native verification must run on GitHub runners. Python tests validate tool selection, rotation command, retry behavior, image dimensions, PID survival and owned-device cleanup; they do not prove a real screenshot.

Sources: [Apple Device Hub interaction controls](https://developer.apple.com/documentation/xcode/interacting-with-your-app-in-the-ios-or-ipados-simulator), [Expo SDK 57 build properties](https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/). Actual run logs are authoritative for timings and fallback provenance.

## Validation checkpoints

- Python verification suite: 19 tests passed, including Device Hub lookup at its new bundle path and headless orientation without a GUI requirement.
- Application lint and TypeScript checks passed. Workflow YAML parses successfully.
- GitHub inventory run 38212643644 confirmed DeviceHub.app at Contents/Applications on Xcode 27.2 beta 2 and a 3-CPU / 7-GB runner.
- Real capture run 38212784963 consumes the already-built 1.0.2 Simulator app; its result is still pending. No native compilation occurred locally.

Further isolation: Device Hub ignores the old -CurrentDeviceUDID argument. Its registered devices URL targets a particular device window on the GUI fallback. Modern capture now stays headless at boot, uses a smaller standard iPad, and clones a shutdown preconfigured runner template when available. Failed clone creation falls back to a fresh device; cleanup never changes the original template. Updated Python suite: 21 tests passed. Expanded AltSource-only galleries remain gated on a fresh baseline screenshot on both families, as requested.

The stable-runner comparison (38214053892) booted and installed successfully (106.6 s / 32.4 s), then failed on the cosmetic status_bar override after 60 s. Status bar and public location setup are now best effort with short timeouts, and cosmetic status-bar work is delayed until the app is alive. App launch/PID survival, actual screenshot capture and iPad landscape dimensions remain required. Python suite: 22 tests passed.

First genuine baseline: run 38214566470, iPhone 18 Pro, fresh image on attempt 1. Downloaded image was visually inspected and showed Velunivo's welcome screen over its rendered map. No historical image was used. iPad result was still pending at this checkpoint.
