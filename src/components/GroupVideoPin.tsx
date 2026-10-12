import React,{lazy,Suspense} from 'react';
import {VideoFeed} from '../groups/voice';
const Video=lazy(()=>import('react-native-webrtc').then(m=>({default:m.RTCView})));
export default function GroupVideoPin({feed}:{feed:VideoFeed}){return feed.url?<Suspense fallback={null}><Video streamURL={feed.url} objectFit="cover" style={{width:36,height:36}}/></Suspense>:null;}
