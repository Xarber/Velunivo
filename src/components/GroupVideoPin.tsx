import React,{lazy,Suspense} from 'react';
import {VideoFeed} from '../groups/voice';
const Video=lazy(()=>import('react-native-webrtc').then(m=>({default:function VideoView(props:React.ComponentProps<typeof m.RTCView>){return React.createElement(m.RTCView,props);}})));
export default function GroupVideoPin({feed,width=36,height=36}:{feed:VideoFeed;width?:number;height?:number}){return feed.url?<Suspense fallback={null}><Video streamURL={feed.url} objectFit="cover" style={{width,height}}/></Suspense>:null;}
