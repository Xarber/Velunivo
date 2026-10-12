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
