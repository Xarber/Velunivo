import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
test('a current group has Leave but no Join button; leaving restores the joining action',()=>{
 const member={id:'a'.repeat(32),name:'QA Rider',updatedAt:10000};let connected=true;
 const group=()=>({code:connected?'ABCD2345':null,snapshot:connected?{members:[member],leader:member.id}:null,selfId:member.id,status:connected?'Group connected':'',muted:[],videoFeeds:{},cameraMuted:true});
 const tag=(props:Record<string,unknown>)=>React.createElement('div',null,props.children as React.ReactNode),text=(props:{children:React.ReactNode})=>React.createElement('span',null,props.children),button=(props:{title?:string;label?:string})=>React.createElement('button',null,props.title||props.label);
 const dependencies=(id:string)=>{
  if(id==='react')return React;if(id.includes('sampleData'))return {useGhostRiders:()=>[]};
  if(id==='react-native')return {View:tag,Image:tag,Pressable:tag,ScrollView:tag,KeyboardAvoidingView:tag,Platform:{OS:'web'},ActivityIndicator:tag,Modal:(p:{visible:boolean;children:React.ReactNode})=>p.visible?tag(p):null};
  if(id.includes('rewardTesting'))return {useDisplayCosmetics:(n:unknown)=>n};if(id.includes('riderBadges'))return {readBadges:()=>[]};
  if(id.includes('useGroupClock'))return {useGroupClock:()=>10000};if(id.includes('GroupProvider'))return {useGroupRide:group};
  if(id.includes('services/store'))return {useStore:()=>({navigationOptions:{groupVoice:false,groupName:'QA Rider'}})};
  if(id.includes('i18n/core'))return {t:(value:string)=>value};if(id.endsWith('/ui'))return {usePalette:()=>({}),styles:{},Button:button,IconButton:button};
  if(id.endsWith('LocalizedText'))return {__esModule:true,default:text};if(id.endsWith('/model'))return {formatGroupCode:(s:string)=>s,riderInitials:()=> 'QA',SHARE_ORIGIN:'https://example.test'};
  if(id==='expo-router')return {router:{}};if(id==='@expo/vector-icons')return {Ionicons:tag};return {__esModule:true,default:tag};
 };
 const context={exports:{},require:dependencies};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/GroupRiding.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,context);
 const Component=(context.exports as {default:React.ComponentType<{active:boolean}>}).default;
 const joined=renderToStaticMarkup(React.createElement(Component,{active:true}));assert(joined.includes('Leave group'));assert(!joined.includes('Join group'));
 connected=false;const left=renderToStaticMarkup(React.createElement(Component,{active:true}));assert(left.includes('Join group'));assert(!left.includes('Leave group'));
});
