# iPad screenshot and build duration investigation

Scope: screenshot automation and build efficiency only; no application features or local native compilation.

## Evidence from release run 38207740453 (1.0.2)

- iPad boot completed, but both app installs exceeded the 60-second limit. The capture step exhausted its eight-minute budget, including diagnostic/cleanup commands on an unresponsive host.
- iPhone also failed fresh verification. Both published images were historical fallbacks from v1.0.0; a successful release job is not proof of a fresh screenshot.
- The script looked exclusively for Simulator.app. Xcode 27 uses Device Hub, whose documented rotation menu is Controls > Rotate Left. The old Device > Orientation > Landscape Left path cannot work there.
- Native iOS archive: 12m39s. Simulator build: 13m42s, previously run serially after the archive. Android build: 27m07s. Overall release: about 41 minutes.
- React Native did enable its ccache wrapper, but Xcode compiler subprocesses did not receive CCACHE_DIR. The configured cache path never existed at save time, and reported cache size was zero.

## Changes under validation

- Recognize Device Hub and rotate the real simulated device using its current menu; retain legacy Simulator support and verify landscape PNG dimensions.
- Allow 90 seconds for app installation, with two complete bounded attempts and historical fallback preserved.
- Run iPhone and Simulator compilation in independent jobs. Screenshot verification can begin as soon as the Simulator build finishes, while Android/device builds continue.
- Pass compiler cache configuration as Xcode build settings, preserving it in compiler subprocesses. Separate device and Simulator cache namespaces; retain a 2 GB bounded cache for each.
- Use available hosted Linux CPUs for Gradle workers, retaining all supported Android ABIs.
- Add a screenshot-only diagnostic workflow which consumes an existing compiled artifact: no binary release or compilation required to debug capture.

Native verification must run on GitHub runners. Python tests validate tool selection, rotation command, retry behavior, image dimensions, PID survival and owned-device cleanup; they do not prove a real screenshot.

Sources: [Apple Device Hub interaction controls](https://developer.apple.com/documentation/xcode/interacting-with-your-app-in-the-ios-or-ipados-simulator), [Expo SDK 57 build properties](https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/). Actual run logs are authoritative for timings and fallback provenance.
