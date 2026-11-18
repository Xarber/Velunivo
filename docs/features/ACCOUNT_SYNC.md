# X-Center ID summary sync

Settings → Data transfer offers optional web account sync once the server is configured. Users can independently enable, pause, and delete each private summary. The web app refreshes approved summaries after opening, returning to the foreground, reconnecting, or changing a recorded ride. A second browser loads the existing account copy. It does not replace another browser’s revision automatically. Sign-in alone uploads nothing. Backup and direct device transfer remain available without an account. This does not import complete rides, settings or tracks into another device.

- Recent neighborhoods resolves up to eight recorded destinations from finished rides in the past 30 days. Photon receives approximate coordinates rounded to two decimal places after the user enables automatic sync for this category. The account receives only area names. These are approximate destination areas, not a complete list of places visited along a ride.
- Ride insights includes aggregate ride count, kilometers and minutes from finished rides in the past 30 days. Routes, timestamps, and vehicle identifiers are excluded.

## Trust boundaries and deployment

Register Velunivo as a confidential website with X-Center ID. The exact registered callback is `https://velunivo.xcenter.it/api/account/callback`. Confirm callback DNS ownership, activate the registration and enable its private app records. Configure `XCENTER_ID_CLIENT_ID` and `XCENTER_ID_CLIENT_SECRET` as server environment variables. Keep credentials out of Expo and browser builds. The server retains short-lived in-memory sessions and transactions. A restart requires signing in again.

The server pins the issuer, checks endpoint origins, validates the signed ID token with a stored nonce, checks state and PKCE, and checks UserInfo against the validated subject. Only the backend handles the opaque provider access token. The consent request includes profile, email and age range. The account panel displays the name or username, email and age range returned under their corresponding granted scopes. Writes require the production browser origin, a session binding and a matching record revision. The backend restricts collection names and payload fields and always writes private records without readers. Local sign-out clears the product session. Provider unlink/revocation is enforced by the records service on its next request. There are no cross-app read permissions granted by this feature.

Before activation, test real login, cancellation, replay, denied storage scope, unlink and expiry using an isolated account. Verify that a second account cannot read the first account's summaries and that conflicting updates reject stale revisions. Native builds currently have no account entry point. Native activation needs HTTPS universal/app links validated with installed signing identities and a separate secure handoff.

Primary sources: [integration guide](https://id.xcenter.it/docs#manual) and the maintained AuthNJS identity and application-data implementations.

## Verification

Local lint and TypeScript checks passed. Nine focused tests passed on Node 24, including the standalone web server, denied unauthenticated access, cross-origin rejection, missing transaction rejection, payload restrictions and the service worker bypass. Live provider sign-in, cross-account isolation with real identities, and native callbacks remain unverified. The release build gate is pending registration and integration validation.

## Developer portal walkthrough

Open [Developer apps](https://id.xcenter.it/developer). Use **Velunivo** as the name, **https://github.com/Xarber/Velunivo** as the repository and **Ride tracking and optional private synchronization of ride summaries** as the description. Select **Website backend** and enter the exact callback above. An optional icon can use Velunivo’s existing branding.

After registration, the portal issues its own DNS challenge. Use the exact TXT host and value it displays, publish it with the domain’s DNS provider, then return to Registered apps to activate. The confidential client secret is for the Velunivo server only. A native app can later use this backend registration with an independently verified app link and one-time handoff.
