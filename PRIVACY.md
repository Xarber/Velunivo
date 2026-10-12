# Privacy and data flows

Velunivo currently has no analytics or account system. Vehicle profiles, custom vehicle pictures, preferences and saved routes are stored locally. Clearing a ride does not delete saved Library routes. Exporting/sharing a GPX is an explicit user action.

Address searches send the typed search to Photon by default. Route calculation sends start/destination coordinates to Valhalla by default, including both bicycle and car-road requests. Their privacy policies and fair-use terms apply. An optional configured proxy may use GraphHopper instead. IP addresses and requests are visible to the selected service. Do not assume routing requests are anonymous.

GPX import is local. The explicit comparison between track endpoints sends those two coordinates for a new route; it does not upload the entire imported track. Map services receive tile/style requests and may infer the viewed region. Native Apple Maps, OpenFreeMap and a configured offline provider have their own terms. A configured TomTom traffic overlay requests tiles through the optional server.

GPS supports active-ride foreground and permitted background guidance/recording; compass and motion diagnostics may pause in the background. Vehicle photos remain local. A local route library or exported GPX can contain sensitive location information; treat device backups, exports and screenshots accordingly.

The optional development server caches results briefly in memory and is not a production account/access-control system. Deployment operators are responsible for their own access controls, logs, retention and privacy disclosures. The app does not currently provide cloud sync, crash detection or server-based background tracking.

Vehicle pictures use the system photo picker on iOS and Android, without requesting camera or microphone access. Selected pictures are resized to at most 512 pixels and JPEG encoded before local persistence; they are never uploaded. Web file imports remain limited to 1 MB. Explore requests foreground location on opening; idle map location updates pause in the background. Active ride GPS can continue with background permission.

Saved Places and ride recordings remain local. Learned pace is derived on device from qualifying GPS intervals; no ride sample is sent to routing providers. Starting a route again sends only the selected recorded start/end coordinates to the configured routing provider. Developer Mode enables explicit raw JSON sharing; such files include sensitive sensor/location data.

A downloadable-map key is stored in native SecureStore and sent only to Stadia map endpoints. Native map caches and provider requests follow the provider's terms; remove downloaded regions and the key in Settings when no longer needed. Live Activities display next-turn/location-related information on the lock screen; they can be disabled in Settings. No push server is configured, and active-ride GPS can update an existing activity while locked with background permission. Force-quitting stops updates.

The web app service worker stores only public application assets for reopening the app offline. Address/route responses, external map/traffic tiles and user exports are not added to its cache. Preferences, saved places/routes and ride records remain in local browser storage. PWA installation does not grant background location access. Renaming a place changes only its local label.

Live trip sharing is optional and starts only after confirmation during real navigation. Anyone with the random session link can see your position, route, ETA and remaining distance/time until sharing ends. No speed, limits, vehicle identity, battery, BLE/sensor data or full ride archive is transmitted. The self-hosted PeerServer sees signaling metadata/IP/session IDs; WebRTC peers and configured STUN/TURN infrastructure may learn network addresses. There is no public peer discovery or stored ride database. Treat links/codes as secrets. Stopping sharing/end of ride disconnects the session, but recipients can retain what they already saw. Mobile suspension can pause updates; the viewer marks stale data. Route links contain endpoint coordinates and labels in the URL and open the recipient’s route planner. See docs/SHARING.md.

## 1.0 regional routing and private transfers

Explicit road-network downloads send the selected route's bounding region to the configured Overpass endpoint (public OpenStreetMap service by default). Downloaded OSM road data stays in app/browser storage until removed. Completed recorded rides may send start/end coordinates to Photon for readable labels when saved places do not match. Optional elevation requests send sampled route coordinates to Valhalla. These lookups may fail without preventing trip storage or navigation.

Private-server device sync can transfer Bluetooth application credentials and a map API key after both devices approve. File backups and public PeerJS Cloud fallback exclude them. Cloud fallback displays a warning and exposes signaling metadata to that public provider; peer payloads still use encrypted WebRTC transport. Signaling-service choice does not authenticate a person's identity: keep codes/links private. Web Bluetooth credentials/API keys are stored browser-locally; native credentials use SecureStore. Clear all data removes app-owned configuration/downloads, not OS pairing grants.

Explicit map selections and submitted coordinates may use the free Photon reverse endpoint to supply a readable address when no saved place matches. Matching saved names avoid the network lookup. These labels do not change the selected coordinates. Offline/unavailable lookups retain coordinates, and no continuous GPS reverse-geocoding is performed.
