# Portable data and device transfer

Settings → General → Data transfer exports/imports JSON backups or opens a one-time PeerJS session. This is a foreground, manually confirmed transfer; it is not an account, cloud backup or background synchronization service.

## Device flow

1. Create a code, or enter the other device's eight-character code (`XXXX-XXXX`). No PeerServer connection occurs before either action.
2. Wait for Connected. The first connection consumes the code: signaling disconnects while the established data channel remains open; additional channels are rejected. The code cannot reconnect after a disconnection. Create a fresh code.
3. Either endpoint chooses Send data and overwrite or Merge data. The code owner arbitrates competing choices; the first choice it receives wins. Overwrite sends from the choosing endpoint to the other endpoint. Merge exchanges both collections.
4. Both endpoints review the mode and counts and independently accept. No backup payload moves before both approvals. For merge, the return transfer follows under that same consent.
5. Done reloads app state. Keep both apps open and online. Connection attempts time out after 15 seconds; sessions expire after ten minutes. Import is blocked during active rides.

Vehicles, places, routes and ride summaries retain their original IDs; recording samples remain linked to their ride IDs. Repeating a merge adds no duplicates for matching IDs. Each device retains its own matching-ID item values and preferences during a merge. Therefore conflicting edits are not resolved automatically. Separately created items with different IDs remain separate even if their names match. Overwrite replaces the receiving device's portable data and preferences.

## Data and privacy

Schema 1 includes vehicles and portable images, saved places/routes, full ride GPS/sensor/Bluetooth timelines, navigation preferences, language and Bluetooth visibility/collection preferences. It does not export BLE associations/authentication secrets, map/API keys, OS permissions, downloaded tiles, temporary rides, welcome markers or release markers. Imported Bluetooth simulation defaults off. Backup JSON is not encrypted at rest: store it privately.

The existing configured PeerServer is used for signaling, never PeerJS Cloud. Native builds use the bundled PeerJS runtime in a hidden WebView; web uses PeerJS directly. Existing EXPO_PUBLIC_SHARE_ORIGIN and EXPO_PUBLIC_PEER_* settings apply to forks. HTTPS/WSS are required outside localhost. WebRTC encrypts the data channel; the short code does not verify a person's identity. Only approve a session with a trusted device. No backup is stored in the signaling service. A configured TURN relay may carry encrypted packets when a direct connection cannot be established.

The JSON limit is 64 million characters (file selection also checks 64 MB). Validation rejects unsupported schemas, invalid locations, duplicate IDs and prototype keys before storage writes. Writes snapshot portable keys and attempt rollback on failure; storage exhaustion can also prevent rollback, so keep a backup before overwriting. Transport uses acknowledged 12,000-character chunks to avoid browser data-channel message limits. Cancelling/interruption can leave a completed first half of a two-way merge; repeating a new merge is safe because IDs persist.

## Maintenance and validation

Update the curated releaseHighlights entry in src/core/appIntroduction.ts for each release, with brief English/Italian feature descriptions. Existing installs see news once per version; fresh installs see the welcome tour once. General settings replays the tour and opens the changelog.

Tests cover schema validation, ID-preserving merge, rollback, random code format, negotiation, dual consent, wrong-session rejection, chunk acknowledgements, bidirectional merge and native WebView script/channel lifecycle. Actual two-origin web transfer was tested with synthetic public fixtures and persisted through reload. Native file/photo import and WebRTC transfer still require an installed GitHub-built app; no local native compilation was performed.
