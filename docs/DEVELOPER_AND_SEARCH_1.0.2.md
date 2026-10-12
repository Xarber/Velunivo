# 1.0.2 — centralized developer tools and address lookup

## Developer Options

Open Settings, tap the version three times within three seconds, enable Developer Mode and open Developer Options. The hidden access card still closes after thirty seconds or leaving Settings. Developer Options now contains:

- Simulate ride using the selected planned route. The shortcut is removed from Explore; the same navigation, speech and Live Activity behavior is preserved, without recording another ride.
- Simulate vehicle telemetry, with the existing vehicle picker. It still applies to navigation and GPS trip recording, and remains visibly marked simulated. Sharing E-Scooter cannot supply simulated/paired vehicle data. The toggle is removed from ordinary Bluetooth settings.
- Live Activity test/start/stop/inspection controls. They are now visible but disabled with an explanation on web/Android; native iOS retains the actual diagnostic implementation.
- Recorded ride JSON diagnostics exports. Ordinary Library sharing exports GPX directly, including with Developer Mode enabled; the debug JSON action is centralized here.
- Existing confirmed Clear all app data controls.

Normal ride replay, data backups and device sync remain normal user features. Raw debug output remains gated by Developer Mode; simulated metrics continue showing the explicit Demo label.

## Coordinates and search

Map selections in the planner and Saved Places first use a nearby saved name, otherwise request a free Photon reverse lookup. Pasted coordinates can also resolve when submitted. Exact coordinates are preserved; the displayed name/address is a label. In-flight lookups for the same rounded coordinate are shared, and stale results cannot overwrite an edited/reordered field. Planning resolves numeric endpoint/stop labels before storing the itinerary. No account/key is needed. The provider has fair-use limits and can be unavailable; offline/failed or ten-second stalled lookups retain readable numeric coordinates.

Enter previously blurred the input, invalidated the request generation, and could prevent the loading flag being cleared. Native inputs now use submitBehavior=submit; React Native Web 0.21 uses its supported blurOnSubmit=false equivalent. Enter preserves results, cancels the debounce timer and avoids a duplicate request for the same in-flight query. Loading clears when a request is invalidated and address search has a twenty-second total timeout, including queue wait.

## Verification

218 JavaScript tests, lint and TypeScript checks pass. Headless Chrome submitted Enter before the debounce expired: exactly one query returned a visible result and the spinner disappeared. A map click used a reverse endpoint fixture to display an address. Developer access was opened through the actual three-tap gate; web Live Activity controls were disabled, telemetry simulation was enabled, and a route simulation launched from this menu with the simulated battery indicator visible. No physical Bluetooth connection or native Live Activity rendering was tested. Tests used public-location fixtures in isolated browser storage; no user data changed. No local native compilation or SDK download occurred.

## Hosting note

The 1.0.1 hosted smoke test caught stale Expo Router screen modules in a web export using shared dependency/cache paths. A clean server-side export corrected it, then hosted drag/search, Library stop pins/directions and map-picked naming checks passed. Future manual exports must clear Metro's cache or use a clean GitHub web artifact; seeing a new version string alone is insufficient evidence of a current screen bundle. Previous immutable deployments remain available for rollback; the running PeerServer does not need a software change or restart for these client features.

## Publication verification

Unsigned app commit `8aa3cb2` and documentation `5cd9ec4` were pushed. Previous release run 38206435416 was force-cancelled before starting [1.0.2 run 38207740453](https://github.com/Xarber/Velunivo/actions/runs/38207740453). Preparation and web jobs passed; iOS/Android were still compiling remotely at this check.

The hosted app uses a clean server-side web export of 5cd9ec46ff9066c1093a9a0f94f5d18b69d6eb7b under the existing immutable release layout. Prior deployment is retained in rollback-1.0.2-web-target.txt; the PeerServer process was not restarted. Nginx/service health and hosted headless Enter/reverse/developer simulation checks passed. A live key-free Photon reverse lookup at a public Milan test point returned Via Broletto 44, Milano. No user location or personal data was sent. The GitHub build and hosting use separate remote environments; no native compile ran locally.
