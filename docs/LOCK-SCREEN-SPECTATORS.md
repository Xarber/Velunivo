# Shared-trip Lock Screen display (1.0.4)

Shared-trip viewers have a separate iOS Live Activity factory. It receives only route arrival/time/distance progress and stale state, never the rider's speed, road limit, battery or telemetry. Navigation and testing retain independent factories. ActivityKit's stale date and widget stale presentation indicate when updates have stopped. Existing peer-session identity and foreground recovery preserve the shared link.

Android uses expo-notifications ~57.0.22, configured through Expo, to show silent ongoing navigation/viewing notifications. A low-importance channel and notification permission are required. The current notification is replaced with an outdated-data message after updates stop; foreground updates refresh it. This is Android notification support, not Apple ActivityKit or Dynamic Island.

No APNs push relay or guaranteed continuous iOS background PeerJS reception was added. The OS may suspend the app/WebView; foreground reconnection and stale-data marking are the fallback. Installed iOS/Android and real background tests remain required. All native compilation happens in GitHub Actions, not on the user's computer.
