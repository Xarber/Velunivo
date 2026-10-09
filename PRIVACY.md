# Privacy and data flows

Velunivo currently has no analytics or account system. Vehicle profiles, custom vehicle pictures, preferences and saved routes are stored locally. Clearing a ride does not delete saved Library routes. Exporting/sharing a GPX is an explicit user action.

Address searches send the typed search to Photon by default. Route calculation sends start/destination coordinates to Valhalla by default, including both bicycle and car-road requests. Their privacy policies and fair-use terms apply. An optional configured proxy may use GraphHopper instead. IP addresses and requests are visible to the selected service. Do not assume routing requests are anonymous.

GPX import is local. The explicit comparison between track endpoints sends those two coordinates for a new route; it does not upload the entire imported track. Map services receive tile/style requests and may infer the viewed region. Native Apple Maps, OpenFreeMap and a configured offline provider have their own terms. A configured TomTom traffic overlay requests tiles through the optional server.

GPS, compass and motion readings support foreground guidance/diagnostics. Vehicle photos remain local. A local route library or exported GPX can contain sensitive location information; treat device backups, exports and screenshots accordingly.

The optional development server caches results briefly in memory and is not a production account/access-control system. Deployment operators are responsible for their own access controls, logs, retention and privacy disclosures. The app does not currently provide cloud sync, crash detection or background navigation.
