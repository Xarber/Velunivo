# X-Center ID summary sync

X-Center ID is the first item in Settings on web and mobile. The account screen discloses which summaries sync before sign-in. The two summary categories default to automatic sync after sign-in. Users can pause each one independently. Users can independently enable, pause, and delete each private summary. The web app refreshes approved summaries after opening, returning to the foreground, reconnecting, or changing a recorded ride. A second browser loads the existing account copy. It does not replace another browser’s revision automatically. Sign-in alone uploads nothing. Backup and direct device transfer remain available without an account. This does not import complete rides, settings or tracks into another device.

- Recent neighborhoods resolves up to eight recorded destinations from finished rides in the past 30 days. Photon receives approximate coordinates rounded to two decimal places after the user enables automatic sync for this category. The account receives only area names. These are approximate destination areas, not a complete list of places visited along a ride.
- Ride insights includes aggregate ride count, kilometers and minutes from finished rides in the past 30 days. Routes, timestamps, and vehicle identifiers are excluded.

## Trust boundaries and deployment

Register Velunivo as a confidential website with X-Center ID. The exact registered callback is `https://velunivo.xcenter.it/api/account/callback`. Confirm callback DNS ownership, activate the registration and enable its private app records. Configure `XCENTER_ID_CLIENT_ID` and `XCENTER_ID_CLIENT_SECRET` as server environment variables. Keep credentials out of Expo and browser builds. The server retains short-lived in-memory sessions and transactions. A restart requires signing in again.

The server pins the issuer, checks endpoint origins, validates the signed ID token with a stored nonce, checks state and PKCE, and checks UserInfo against the validated subject. Only the backend handles the opaque provider access token. The consent request includes profile, email and age range. The account panel displays the name or username, email and age range returned under their corresponding granted scopes. Writes require the production browser origin, a session binding and a matching record revision. The backend restricts collection names and payload fields and always writes private records without readers. Local sign-out clears the product session. Provider unlink/revocation is enforced by the records service on its next request. There are no cross-app read permissions granted by this feature.

Before activation, test real login, cancellation, replay, denied storage scope, unlink and expiry using an isolated account. Verify that a second account cannot read the first account's summaries and that conflicting updates reject stale revisions. Native sign-in opens a one-time HTTPS start URL at Velunivo in the system browser. The browser binds the transaction with a short-lived Secure HttpOnly cookie before redirecting to X-Center ID. The normal website callback performs the confidential OAuth exchange. It then displays a completion message with no session token or redemption code in the browser URL. The app checks for completion after returning to Settings. It proves possession of the verifier stored in SecureStore, and the backend allows a single redemption. Both the pending verifier and the resulting session use SecureStore. This flow works independently of Apple Universal Links, Android App Links and custom schemes.

Primary sources: [integration guide](https://id.xcenter.it/docs#manual) and the maintained AuthNJS identity and application-data implementations.

## Verification

Local lint and TypeScript checks passed. Nine focused tests passed on Node 24, including the standalone web server, denied unauthenticated access, cross-origin rejection, missing transaction rejection, payload restrictions and the service worker bypass. Live provider sign-in, cross-account isolation with real identities, and native callbacks remain unverified. The release build gate is pending registration and integration validation.

## Developer portal walkthrough

Open [Developer apps](https://id.xcenter.it/developer). Use **Velunivo** as the name, **https://github.com/Xarber/Velunivo** as the repository and **Ride tracking and optional private synchronization of ride summaries** as the description. Select **Website backend** and enter the exact callback above. An optional icon can use Velunivo’s existing branding.

After registration, the portal issues its own DNS challenge. Use the exact TXT host and value it displays, publish it with the domain’s DNS provider, then return to Registered apps to activate. The confidential client secret is for the Velunivo server only. Native builds use the same backend registration and the same HTTPS OIDC callback.

## Production deployment receipt

X-Center now serves web commit `577d5f1d8a6a2bad9994e8f54e20880e4f76e978` with the matching account-sync server. DNS publishes the callback verification TXT record. A public sign-in start sent the registered client to the issuer interaction screen. Public web and peer health passed, including a fresh WSS signaling handshake. The credential is loaded from a root-readable server environment file. The prior web and runtime selectors are recorded in `rollback-account-sync-targets.txt` on the host. A completed provider consent and real two-browser sync have yet to be verified.

The November 19 native implementation passed local lint, type checking and nine focused tests. The live host had no Apple or Android signing associations at inspection. An installed signed build must verify the authorization return and exchange before native sign-in is considered verified.

### November 19 deployment

Web commit `ec2ba1dea8ebe9fba5df6c84d523d15cceec5127` and its backend are live. The dedicated Settings page and HTTPS return route respond, the issuer accepted the web sign-in request, and PeerServer signaled OPEN. The server reports that both native signing associations are missing, so the native sign-in entry explains that dependency. The previous deployment remains in `rollback-native-account-targets.txt`. Native build artifacts were requested in [run 44462408799](https://github.com/Xarber/Velunivo/actions/runs/44462408799). No native release is implied by that run.

The browser handoff supersedes the earlier native signing-association proposal. An installed build still needs an interactive verification of successful consent and session pickup.

The browser handoff is deployed at web and server commit `2d69c2c74da9f8bac192b2eb13a83e740776e80e`. Staging exercised the website start, single-use browser launch, pending claim, wrong verifier, missing browser cookie, consent denial and replay. Public web sign-in startup and PeerServer signaling passed. The previous live selectors are recorded in `rollback-browser-account-targets.txt`. Native artifacts for this revision were requested in [run 44466579240](https://github.com/Xarber/Velunivo/actions/runs/44466579240). Successful consent and session pickup on an installed device are still pending.


## App data categories

The X-Center ID screen offers Settings, Vehicles (including portable pictures and maintenance), Saved places, Saved routes, Recorded rides (including GPS tracks and recorded samples), and Exploration history. Each category has an independent switch and shows the estimated local UTF-8 payload size before compression. Categories of 256 KiB or more, recorded rides, and exploration history initially stay off. New sign-ins after the expanded disclosure enable smaller categories by default. Existing sessions retain their prior permission and can enable the new categories individually. The two existing summary categories remain separate. Pausing a category stops future transfers on this device. Existing remote data remains in the account.

The category payload uses the existing portable backup schema and timestamp/record revision merge. Import overlays only the selected category onto the local envelope, then uses the ordinary validation and merge path. Default or disabled categories cannot remove unrelated records. Updates run on foregrounding, ride changes, reconnect on web, and every 90 seconds while in use. A ride lock defers portable sync during navigation or recording.

The backend stores compressed parts privately using X-Center ID's existing app data API. It switches the manifest with an expected revision after uploading every part. It cleans up the older generation after a successful switch. It avoids deleting the new generation when it cannot determine whether an interrupted request committed. The hard raw limit is 8 MiB per category, and the packed limit is 48 parts of 42,000 bytes. Account quota and upstream limits still apply. Peer transfer and file backup remain available for larger archives. Provider authentication and per-category session binding apply before parsing large requests. Pairing credentials, API keys, developer and simulation settings, memories media, and downloaded maps are excluded. Enabling rides exports location and sensor history to the private account store.

The category update passed lint, type checking and the complete 570-test suite. The mocked provider test verified private multi-part writes, stale-revision rejection, replacement and deletion. Staging and production both rejected unauthenticated archive access. Web and server commit `1686435ee66b6a9ce56f67b61b8b14e50efd82fa` are live. Web health and a fresh public PeerServer connection passed. Rollback targets are in `rollback-account-archive-targets.txt`. [Native artifact build](https://github.com/Xarber/Velunivo/actions/runs/44468650200) is in progress. Authenticated sync between two installations remains unverified.

## Default rider profile and iOS screen crash

When the account settings screen has a verified session and the local navigation preferences have loaded, Velunivo can seed an empty rider profile with the name (or username) and picture from X-Center ID. Any existing rider name, picture, or recorded user edit to either field prevents the seed. Account defaults have no user edit timestamp so later custom edits win during normal settings sync. Email and age range stay in the account panel. The backend takes the picture capability from authenticated UserInfo, reads only the documented issuer JPEG endpoint with the provider bearer token, and streams at most 512 KiB. The app resizes it to the same 128-pixel JPEG format and size limit as a custom rider photo. The provider token and browser cookies stay out of the image URL and client profile.

The iOS 2.8.8 (143) crash report shows React Native invoking its fatal JavaScript exception handler and then aborting. It does not contain the JavaScript message. The Settings account screen was reading browser location synchronously if a window shim existed. That read is now gated to web with a missing-location fallback. A regression test exercises a native window shim whose location access throws. Installed iPhone reproduction and verified avatar import remain separate device checks.
