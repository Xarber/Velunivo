import React,{forwardRef,useImperativeHandle,useMemo,useRef} from 'react';
import {WebView} from 'react-native-webview';
import {sandboxDocument} from './sandbox';
export type SandboxHandle={send(value:unknown):void};
export type SandboxProps={code:string;token:string;onMessage(value:string):void};
export default forwardRef<SandboxHandle,SandboxProps>(function PluginSandbox({code,token,onMessage},ref){const view=useRef<WebView>(null),html=useMemo(()=>sandboxDocument(code,token),[code,token]);useImperativeHandle(ref,()=>({send:value=>view.current?.injectJavaScript(`window.receivePluginMessage(${JSON.stringify(value)});true;`)}),[]);return <WebView ref={view} source={{html}} style={{width:1,height:1,opacity:0}} originWhitelist={['about:blank']} javaScriptEnabled domStorageEnabled={false} allowFileAccess={false} allowUniversalAccessFromFileURLs={false} mixedContentMode="never" setSupportMultipleWindows={false} onShouldStartLoadWithRequest={request=>request.url==='about:blank'} onMessage={event=>onMessage(event.nativeEvent.data)} onContentProcessDidTerminate={()=>onMessage(JSON.stringify({token,type:'error',message:'Plugin runtime stopped.'}))}/>;});
