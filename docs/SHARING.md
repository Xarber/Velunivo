# Route and live trip sharing (0.1.24)

## Using it

Explore → select a route → share icon → **Share route link** shares only the start/end coordinates and labels. Opening `/share/route?...` on web or `velunivo://share/route?...` shows the endpoints, then **Plan on this device** requests bicycle/car-road alternatives using the recipient’s own vehicle. It does not start navigation. It is an endpoint planning link, not a promise to reproduce an identical road geometry under different vehicle settings or provider data.

During **real GPS navigation**, expand Your ride → **Share trip** → read the explanation → **Confirm trip sharing**. Only that confirmation creates a PeerJS connection and a cryptographically random 20-character code (120 bits). Copy/share the resulting `/share/trip?pin=...` link. Controls can collapse without disconnecting. Stop sharing, ending/arriving at the ride, closing/unmounting Explore, or the 12-hour timeout revokes the session. No persistent session database or account is created. Destination-free Record trip and simulated navigation do not expose this action.

Recipients see the full-route map and, after **View shared trip**, rider location, arrival clock time, minutes left and distance left in their chosen units. No local GPS permission is needed. Updates older than 20 seconds are labelled paused; ETA/remaining values are hidden instead of presented as live. Last known location remains labelled by the update timestamp. Retry reconnects to a still-active rider. Once a sharing session ends, its code cannot resume it.

The wire contract explicitly whitelists route coordinates/labels and position/ETA/remaining fields. Vehicle identity, speed, speed limits, road detail registers, compass, battery, Bluetooth readings, sensor records and telemetry are never included. Incoming data is reconstructed, validated and bounded; viewers cannot control navigation. Audio/video calls are rejected. Maximum eight concurrent viewers; progress broadcasts are throttled to one per five seconds and unchanged geometry is sent only on the first connection or route change. A newly connected viewer receives the cached route/latest progress.

## One process for web and PeerServer

The repo includes `server/web.ts` and `server/start-web.ts`. **`npm run serve:web`** serves the exported app and the PeerServer under `/peer` in the same process. It fails clearly if `dist/index.html` is missing. `/health` reports both components, deep web paths fall back to index.html, `.mjs` receives JavaScript MIME type, PeerServer discovery is disabled, and responses use `Referrer-Policy: no-referrer`. The public HTML has the same referrer policy for static-only hosts. The optional standalone `npm run server:peer` is for development/separate signaling deployments.

For a small production install, copy the **server/** directory and install just its dependencies with `npm ci --prefix server`. Its independent package/lock pins express, peer, tsx and a ws8 override: peer1.0.2 declares ws7 but its implementation calls the ws8 WebSocketServer export. The override avoids a genuine startup failure verified during testing. Server-only dependency audit returned zero advisories. Set `WEB_DIR` to a downloaded/unpacked workflow `web.zip` and run `npm start --prefix server`. Native compilation is unnecessary on the host.

Node22.13+ is required (Node24 is recommended). Typical environment:

```sh
HOST=127.0.0.1 PORT=8790 WEB_DIR=/srv/velunivo/dist BEHIND_PROXY=1 SHARE_ORIGIN=https://velunivo.example npm start --prefix server
```

Use TLS/WSS at the reverse proxy. `deploy/nginx-sharing.conf` and `deploy/velunivo-web.service` are templates; adapt paths/Node PATH on your host. Preserve your existing TLS configuration and a rollback copy. The single Node process should start at boot. Keep previous web releases and atomically change the WEB_DIR symlink; changing the web files does not require restarting a running signaling server unless server code changes. No access log should record full PIN URLs. PeerServer retains signaling metadata only, not ride/location payloads.

## Forks and build hostname

**Official native builds default to https://velunivo.xcenter.it**. Web defaults to its current origin so another hosted fork works on its own hostname. No app path silently falls back to PeerJS Cloud.

Set GitHub repository **Settings → Secrets and variables → Actions → Variables → SHARE_ORIGIN** to your HTTPS origin (e.g. `https://rides.example`). The release workflow passes it as `EXPO_PUBLIC_SHARE_ORIGIN` in web, Android and iOS jobs. For local development, set the same EXPO_PUBLIC variable. Native builds embed the hostname, so rebuild after changing it. The web app uses that explicit origin if provided, otherwise its own. Only origins are accepted (no credentials/path/query); HTTP is accepted only for loopback development.

PeerJS automatically uses that origin’s hostname/port with `/peer` and matching TLS. Optional repository variables `PEER_HOST`, `PEER_PORT`, `PEER_PATH`, `PEER_SECURE`, `PEER_ICE_SERVERS` allow a separate signaling server, custom port/path or ICE configuration. All are public build configuration. Do not put long-lived/private TURN passwords in a public build; use suitably restricted or short-lived credentials. Example `PEER_ICE_SERVERS`: `[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:turn.example:3478","username":"short-lived","credential":"short-lived"}]`. A TURN service is needed for reliable connectivity across restrictive cellular/Wi-Fi NATs; PeerServer signaling alone cannot guarantee all peer connections. There is no paid TURN dependency bundled. Private signaling outage checks allow disclosed PeerJS Cloud fallback; missing peers/configuration errors do not. Sensitive sync data is unavailable on public fallback.

Custom-scheme deep links work through Expo Router and +native-intent; web screens provide **Open in Velunivo app**. Automatic HTTPS Universal Links additionally require a real Apple team, signed associated-domain entitlements and AASA registration; they are not claimed for unsigned/TrollStore binaries. The web server can return AASA at `/.well-known/apple-app-site-association` when APPLE_TEAM_ID (and optionally APP_IDENTIFIER) is configured; configure your fork’s native associatedDomains separately. Without it, the web link and explicit app-open button still work.

## Native transport, privacy and limits

PeerJS runs natively in an invisible WKWebView/Android WebView using the installed MIT PeerJS bundle, generated by postinstall. No external CDN code or camera/microphone permission is requested. A new native GitHub build is needed for react-native-webview13.16.1. The browser uses PeerJS directly. Both transports cache late-viewer state and stop their peer/data channels when removed. PeerJS and PeerServer are MIT; see their upstream repository licenses and installed package licenses.

Anyone possessing the code/link can view location/route while sharing is active; treat it as a secret. Signaling servers see IP addresses, connection metadata and session identifiers; peers and any configured STUN/TURN service may also see network addresses. WebRTC encrypts data channels, but this feature has no separate authenticated identity/account and cannot stop a recipient saving or forwarding what they see. Route links expose endpoints/labels in the URL and are not live location sessions. Nothing uploads full local ride archives.

Background GPS may continue normally, but iOS can suspend WKWebView/WebRTC, and mobile browsers can suspend background tabs. **Continuous locked-screen/background peer sharing is not guaranteed**. Viewers mark stale data, not an invented ETA. Native iOS/Android peer transport and cross-network cellular/TURN reliability require physical-device testing. Web RTC communication was verified locally using public Milan landmark QA data with self-hosted signaling; no private location was used. Protocol/session tests and native HTML runtime contract tests do not constitute physical iPhone proof.

References: [PeerJS data API](https://peerjs.com/client/getting-started), [PeerServer/Express integration](https://github.com/peers/peerjs-server), [Expo57 WebView](https://docs.expo.dev/versions/v57.0.0/sdk/webview/), [Expo build environment variables](https://docs.expo.dev/guides/environment-variables/), [Expo Router native intents](https://docs.expo.dev/router/advanced/native-intent/).

## Viewer presence

The host counts each peer after successfully sending a progress update. A closed channel retains presence until 60 seconds after its last progress update; repeated channels from the same peer do not double-count. A one-second host timer expires presence even when there are no further location updates. Closing the sharing session clears presence immediately. Web and native transports share this rule; speed, road limits, battery and telemetry remain excluded from shared data.

## Native hosting and connection reliability (0.1.32)

The native WebView runtime no longer embeds `createViewerPresence.toString()`. Hermes can return a bytecode placeholder instead of source, crashing the script before its PeerServer connection and timeout are established. Viewer-presence code is now literal JavaScript, with matching sixty-second expiry tests. Reference: [Hermes source-visibility issue](https://github.com/facebook/hermes/issues/1583). A React-side startup watchdog also reports failure if the WebView never reaches ready; terminated WebView processes report a usable error. Closing a failed session does not overwrite its timeout/error with a later signaling-disconnected event.

Joining clients generate their own 128-bit random PeerJS IDs. This avoids the server `/id` request, which can fail under cross-origin restrictions in WebViews, alternate browser origins and local previews. Existing PeerServer CORS restrictions remain intact. Web trip sharing statically loads PeerJS; it has no lazy-import startup dependency. No connection starts until the user's existing sharing confirmation.

The public `velunivo.xcenter.it` signaling endpoint was checked over HTTPS and WebSocket. The actual bundled native HTML script hosted a synthetic public-Milan trip and delivered its route/progress to a second isolated browser through that PeerServer; the host reported ready and one viewer. This is browser validation of the native script, not an installed iOS/WKWebView test. No private ride or device position was transmitted. The server protocol did not change and no PeerServer software update is required. Deploy the updated web client to fix hosted web UI behavior; native users need the new binary.

### Viewer identity and Live Activities (0.1.33)

Each viewer allocates a random, trip-view-session-scoped identifier before connecting. Reconnect retries retain this identifier in PeerJS connection metadata while still allocating fresh signaling peer IDs. Both host implementations validate its format and replace an older channel for the same identifier; presence is keyed by this identifier instead of the transient connection. Separate viewers remain separate. The existing sixty-second grace period after the last sent progress update is retained. Leaving/reopening the viewing page creates a new session; this is not an account or persistent device fingerprint. Legacy clients without metadata retain the previous peer-ID fallback.

Host presence is exposed locally to the navigation Live Activity. The Lock Screen and expanded Dynamic Island show a person icon and spectator count only while sharing is enabled. Battery stays private: the public route/progress whitelist has not changed. This requires updated host and viewer clients, including the hosted web bundle, but no PeerServer upgrade or configuration change.

### Suspension and connection recovery

Notification Center/inactive transitions do not explicitly stop sharing or revoke consent. Native WebView page hiding leaves healthy sockets/channels alive, and the app probes the script on foreground return. A dead process, unanswered probe or failed channel rebuilds the transport with the same host PIN/viewer identity. Browser visibility, focus and online events also resume recovery. PeerJS signaling disconnects reconnect with a twenty-second deadline; existing healthy channels survive signaling recovery. Failures recreate transports with one deduplicated retry timer and exponential backoff capped at thirty seconds. Spectators automatically retry dropped channels and thirty seconds without progress; the last route remains visible and stale location is clearly indicated. Fresh progress resets retry backoff. Explicit close, real trip-ended messages and consent revocation cancel recovery.

Transient recovery never sends a trip-ended message, so spectators can rejoin the original link when the host returns. Route/current progress are republished to recovered transports. No PeerServer change is needed; both app and hosted viewer bundle need the new client code. WKWebView/WebRTC and JavaScript may be suspended by iOS; background connectivity is best effort, foreground recovery is automatic while the ride and sharing consent remain active. Force termination does not restore rides or sharing automatically. No silent audio or unsupported background execution workaround is used.

### Automatic HTTPS app opening (next build)

Native configuration now derives iOS `associatedDomains` and Android verified `/share/` intent filters from `EXPO_PUBLIC_SHARE_ORIGIN` (official default `https://velunivo.xcenter.it`). Local HTTP development retains custom links. The server serves AASA only with a valid `APPLE_TEAM_ID`; Android `assetlinks.json` requires comma-separated SHA-256 certificate fingerprints in `ANDROID_CERT_FINGERPRINTS`. `APP_IDENTIFIER` defaults to `app.velunivo.mobile` for both. These public association identifiers must match the app's actual signing identity, and endpoints must be deployed over HTTPS without redirects. No invented Apple team or signing fingerprint is published. Existing “Open in Velunivo app” remains available.

Unsigned/TrollStore/LiveContainer installation does not establish normal Apple Universal Link entitlement validation. Without a matching Apple team/provisioning setup, the HTTPS URL still opens the web, followed by the explicit app-open button. Android verification needs the real APK certificate and an installed build; source configuration alone is not device proof.

Native PeerJS transports now allow the inline document's exact configured origin with or without a trailing slash, while rejecting external navigation. Trip-viewer consent survives background/focus changes, and native data-sync WebView source objects remain stable. These changes need native runtime validation. On iOS the share sheet receives the URL once (`url` only); Android uses `message` only.
