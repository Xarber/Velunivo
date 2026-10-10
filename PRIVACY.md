# Privacy and data flows

Velunivo currently has no analytics or account system. Vehicle profiles, custom vehicle pictures, preferences and saved routes are stored locally. Clearing a ride does not delete saved Library routes. Exporting/sharing a GPX is an explicit user action.

Address searches send the typed search to Photon by default. Route calculation sends start/destination coordinates to Valhalla by default, including both bicycle and car-road requests. Their privacy policies and fair-use terms apply. An optional configured proxy may use GraphHopper instead. IP addresses and requests are visible to the selected service. Do not assume routing requests are anonymous.

GPX import is local. The explicit comparison between track endpoints sends those two coordinates for a new route; it does not upload the entire imported track. Map services receive tile/style requests and may infer the viewed region. Native Apple Maps, OpenFreeMap and a configured offline provider have their own terms. A configured TomTom traffic overlay requests tiles through the optional server.

GPS, compass and motion readings support foreground guidance/diagnostics. Vehicle photos remain local. A local route library or exported GPX can contain sensitive location information; treat device backups, exports and screenshots accordingly.

The optional development server caches results briefly in memory and is not a production account/access-control system. Deployment operators are responsible for their own access controls, logs, retention and privacy disclosures. The app does not currently provide cloud sync, crash detection or background navigation.

Vehicle pictures use the system photo picker on iOS and Android, without requesting camera or microphone access. Selected pictures are resized to at most 512 pixels and JPEG encoded before local persistence; they are never uploaded. Web file imports remain limited to 1 MB. Explore requests foreground location on opening; location updates pause in the background.

Saved Places and ride recordings remain local. Learned pace is derived on device from qualifying GPS intervals; no ride sample is sent to routing providers. Starting a route again sends only the selected recorded start/end coordinates to the configured routing provider. Developer Mode enables explicit raw JSON sharing; such files include sensitive sensor/location data.

A downloadable-map key is stored in native SecureStore and sent only to Stadia map endpoints. Native map caches and provider requests follow the provider's terms; remove downloaded regions and the key in Settings when no longer needed. Live Activities display next-turn/location-related information on the lock screen; they can be disabled in Settings. No push server is configured, and guidance remains foreground-only.
