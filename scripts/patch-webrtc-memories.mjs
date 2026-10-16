import fs from 'node:fs';
const patch=(path,old,next)=>{let source=fs.readFileSync(path,'utf8');if(source.includes(next))return;if(!source.includes(old))throw new Error(`Receiver-track forwarding patch no longer matches ${path}`);fs.writeFileSync(path,source.replace(old,next));};
// Forwarding an already received track is standard WebRTC behavior. Scope the lookup
// to its original connection; never guess by ID across unrelated peer connections.
patch('node_modules/react-native-webrtc/src/RTCPeerConnection.ts','{ streamIds });','{ streamIds, sourcePeerConnectionId: track.remote ? track._peerConnectionId : -1 });');
patch('node_modules/react-native-webrtc/ios/RCTWebRTC/WebRTCModule+RTCPeerConnection.m','RTCMediaStreamTrack *track = self.localTracks[trackId];\n\n        NSArray *streamIds',`RTCMediaStreamTrack *track = self.localTracks[trackId];
        NSNumber *sourcePeer = options[@"sourcePeerConnectionId"];
        if (!track && sourcePeer && sourcePeer.intValue >= 0) track = self.peerConnections[sourcePeer].remoteTracks[trackId];
        if (!track) { RCTLogWarn(@"Memory receiver track is no longer available"); return; }

        NSArray *streamIds`);
patch('node_modules/react-native-webrtc/android/src/main/java/com/oney/WebRTCModule/WebRTCModule.java','MediaStreamTrack track = getLocalTrack(trackId);\n                        if (track == null)',`MediaStreamTrack track = getLocalTrack(trackId);
                        if (track == null && options.hasKey("sourcePeerConnectionId")) {
                            track = getTrack(options.getInt("sourcePeerConnectionId"), trackId);
                        }
                        if (track == null)`);
