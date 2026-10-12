# Group rides and audio

Groups admit at most eight riders through a XXXX-XXXX invitation code. A separate admission peer and a full mesh of data channels carry profiles, locations, the exact navigation geometry and instructions. Neither battery nor Bluetooth credentials are shared. Recording groups share locations, while each recorder stores only its own GPS samples. Ending a ride or leaving the screen that owns its active ride leaves the group.

Leadership follows admission order. After a sixty-second absence the earliest reachable rider takes over; an original leader who reconnects with the same room identity regains leadership. An explicit departure relinquishes membership and priority. Leaders can remove riders; removed identities cannot rejoin the same room. Room identities expire after twelve hours and are not included in data backups. Codes are invitations rather than an identity verification system.

Voice is opt-in through Profile & Group Riding. Disabled voice never opens the microphone or starts the system call. If another connected participant has opted into voice, the roster shows an availability banner and an Enable voice chat action, which saves the preference and joins automatically. System End Call disables the saved preference without leaving the data group. A later Enable action is required to rejoin voice.

Microphone and incoming audio controls are independent. Muting the microphone stops capture tracks and replaces outgoing RTP sender tracks with null. Unmuting acquires a new audio-only stream. Muting all incoming audio retains individual rider mute choices. There is no camera capture, video negotiation or video UI; incoming video offers are rejected.

## Native integration and limitations

`react-native-webrtc` 124.0.8 and its config plugin 15.0.2 require a new native build; Expo Go cannot provide this feature. The Android Expo module uses AndroidX Core Telecom 1.0.0 and an ongoing foreground call service. The existing iOS audio module adds an audio-only CallKit provider named Velunivo Group Ride. Navigation announcements preserve the active group audio session. Native end/mute events feed the common voice controller.

Native audio supports background execution, but operating-system suspension, termination, connectivity and signaling availability can interrupt the group. Presence and mesh dialing retry automatically, unhealthy audio connections restart ICE and rebuild, and foreground restoration explicitly resumes connections. Browser pages can be suspended in the background. No promise of uninterrupted background connectivity is made. Remote-network connectivity may require a configured TURN relay; STUN alone is not sufficient on every network.

## Validation

268 automated tests pass, including group capacity, defensive message parsing, leadership transfer/recovery, microphone release/races, audio reconnection, individual/all-audio mute and rejection of video. A real headless Chrome two-context WebRTC test verifies an established audio connection, outbound audio RTP, stopped capture and null sender while muted, fresh capture on unmute and cleanup. Its synthetic microphone is a test input, not physical hardware validation. A two-context full-app Chrome check also verifies group admission without profile photos, zero microphone requests while voice is off, the availability banner, persisted enabling, established group audio and both mute controls.

Native CallKit/Core Telecom controls and background audio still require the next native CI build and physical-device verification. No native compilation or SDK downloads were performed locally. Android release compilation is limited to two workers with a 4 GB Gradle heap after version 1.0.7 exhausted the prior heap during native debug metadata merging; improvement must be measured on CI.

## 1.0.9 — native transport and developer video

Native group rides, trip sharing and device sync now use react-native-webrtc directly, with native WebRTC registered before importing PeerJS. The previous hidden WKWebView/Android WebView transport is retired from those production paths. This removes hidden-page throttling and JSON injection/bridge serialization from connection setup. Foreground restoration resumes signaling and connections. Physical iPhone performance still needs verification; changing transport is not proof of hardware success.

All current clients use bounded string frames over PeerJS raw channels, avoiding the library's 16 KiB JSON-message limit and native Blob conversion. Reassembly is capped at 5 million characters per message, four incomplete messages per listener, and a twenty-second expiry. Admission waits for a route-received acknowledgement instead of closing the handshake channel after two seconds. This protects large GPX and profile packets from premature closure. Existing JSON/binary connections can still deliver decoded legacy objects; all participants should update for the new group/video behavior.

Joining a navigation group automatically selects the exact shared route and opens Explore, ready to start using the ordinary navigation controls. It never injects another rider's path into local recording. Navigation permissions and route warnings retain their normal behavior.

Developer Options → Group riding → Video sharing is off by default. Sending and receiving require Developer Mode, video sharing, map pins and voice enabled locally, plus the other rider's explicit video opt-in. Each participant has a camera button alongside microphone mute. Camera off releases capture and detaches video RTP senders; backgrounding stops the camera, with automatic foreground restoration if still enabled. Voice and data stay independent of camera capture. The system group call remains an audio call; video is rendered only within map people pins.

Map people pins follow Life360's circular photo, white rim, app-accent outline and location tip, with initials when no photo is available. Camera-off participants fall back to their photo/initials. Video targets 96×96 at 6 fps and 80 kbps per recipient where encoder controls are supported. Capture dimensions/bitrate are negotiated constraints, not a guarantee on every physical camera. Small streams can still use noticeable data with seven recipients.

Validation includes real Chrome WebRTC with three peers: two opted into video and one audio-only, no video/camera request for the third, observed 96×96/6 fps capture, and stopped camera/null sender after disabling. A real PeerJS group test delivers a 10,000-point route and a ~39 KB profile. Native rendering/connection speed remains an on-device check. The updated hosted web build is required for matching client behavior; the PeerServer protocol and server package are unchanged.

Final 1.0.9 validation: 273 tests, lint and TypeScript checks pass. Full-app Chrome confirms automatic route adoption on joining. Availability changes bypass the routine presence throttle to avoid delaying media negotiation. Camera usage permission describes optional sharing explicitly. No local native compilation was performed.
