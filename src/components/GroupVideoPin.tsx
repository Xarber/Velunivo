import React,{lazy,Suspense,useState} from 'react';import {VideoFeed} from '../groups/voice';
const Video=lazy(()=>import('react-native-webrtc').then(m=>({default:function VideoView(props:React.ComponentProps<typeof m.RTCView>){return React.createElement(m.RTCView,props);}})));
/** Keep the avatar underneath until the renderer has received real video dimensions. */
export default function GroupVideoPin({feed,width=36,height=36}:{feed:VideoFeed;width?:number;height?:number}){const [rendered,setRendered]=useState<string|null>(null);return feed.url?<Suspense fallback={null}><Video streamURL={feed.url} onDimensionsChange={e=>{if(e.nativeEvent.width>0&&e.nativeEvent.height>0)setRendered(feed.url!);}} objectFit="cover" style={{width,height,opacity:rendered===feed.url?1:0}}/></Suspense>:null;}
