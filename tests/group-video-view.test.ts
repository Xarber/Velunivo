import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import React from 'react';import {renderToPipeableStream} from 'react-dom/server';import {PassThrough} from 'node:stream';
test('native lazy video resolves to a React wrapper even when RTCView is a host string',async()=>{
 const source=ts.transpileModule(fs.readFileSync('src/components/GroupVideoPin.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{} as {default:React.ComponentType<{feed:{url:string}}>}};
 vm.runInNewContext(source,{module,exports:module.exports,require:(name:string)=>name==='react'?React:name==='react-native-webrtc'?{RTCView:'rtc-video-view'}:undefined});
 const output=await new Promise<string>((resolve,reject)=>{const sink=new PassThrough();let text='';sink.on('data',chunk=>text+=chunk);sink.on('end',()=>resolve(text));const rendered=renderToPipeableStream(React.createElement(module.exports.default,{feed:{url:'native-stream'}}),{onAllReady(){rendered.pipe(sink);},onError:reject});});
 assert.match(output,/<rtc-video-view/);assert.match(output,/native-stream/);
});
