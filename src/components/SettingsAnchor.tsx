import React,{createContext,useContext,useRef} from 'react';import {View} from 'react-native';
export const SettingsAnchorContext=createContext<(id:string,node:View|null)=>void>(()=>{});
export default function SettingsAnchor({id,children}:{id:string;children:React.ReactNode}){const report=useContext(SettingsAnchorContext),node=useRef<View>(null);return <View collapsable={false} ref={node} onLayout={()=>report(id,node.current)} style={{gap:12}}>{children}</View>;}
