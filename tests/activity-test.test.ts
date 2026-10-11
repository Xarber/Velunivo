import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness() {
 const layouts=new Map<string,(props:any,environment:any)=>any>();
 const extras={batteryPercent:56,viewerCount:2};
 const factories=new Map<string,{instances:{end:(policy:string)=>Promise<void>}[];starts:unknown[][]}>();
 let timeout:(()=>void)|undefined;
 const state={currentState:'active'};
 const mocks:Record<string,unknown>={'./activityExtras':{currentActivityExtras:()=>extras},react:{createElement:(type:unknown,props:unknown,...children:unknown[])=>({type,props,children})},'react-native':{AppState:state},'./activityInstallation':{inspectActivityInstallation:()=>null},'../core/activityDiagnostics':{activityDiagnosis:()=>''},'@expo/ui/swift-ui':{Image:'Image',Text:'Text',VStack:'VStack',HStack:'HStack'},'@expo/ui/swift-ui/modifiers':{font:()=>({}),foregroundStyle:()=>({}),padding:()=>({})},'../core/liveActivity':{rideActivity:()=>({turn:'turn'})},'../core/navigation':{},'expo-widgets':{createLiveActivity:(name:string,layout:(props:any,environment:any)=>any)=>{layouts.set(name,layout);
  const f={instances:[] as {end:(policy:string)=>Promise<void>}[],starts:[] as unknown[][]};factories.set(name,f);
  return {getInstances:()=>f.instances,start:(...args:unknown[])=>{f.starts.push(args);const live={end:async(policy:string)=>{assert.equal(policy,'immediate');f.instances=f.instances.filter(i=>i!==live);}};f.instances.push(live);return live;}};}}};
 const context={exports:{},require:(name:string)=>{assert.ok(name in mocks,name);return mocks[name];},setTimeout:(fn:()=>void)=>{timeout=fn;return 1;},clearTimeout:()=>{timeout=undefined;},Date};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/useNavigationActivity.ios.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,context);
 return {layouts,extras,api:context.exports as {markActivityPaused:()=>Promise<void>;updateRideActivity:(...args:any[])=>Promise<void>;startTestLiveActivity:()=>Promise<{activeCount:number}>;stopTestLiveActivity:()=>Promise<void>},factories,state,expire:()=>timeout?.()};
}
test('temporary activity uses a separate factory and never ends a real navigation activity',async()=>{
 const h=harness(),ride=h.factories.get('VelunivoNavigation')!,demo=h.factories.get('VelunivoNavigationTest')!;
 ride.instances.push({end:async()=>{throw new Error('Test touched the active ride');}});
 assert.equal((await h.api.startTestLiveActivity()).activeCount,2);
 assert.match((demo.starts[0][0] as {turn:string}).turn,/Live Activity test/);
 await h.api.startTestLiveActivity();assert.equal(demo.instances.length,1);
 await h.api.stopTestLiveActivity();assert.equal(demo.instances.length,0);assert.equal(ride.instances.length,1);
});
test('activity test requires foreground and cleans up its own activity on timeout',async()=>{
 const h=harness();h.state.currentState='background';
 await assert.rejects(h.api.startTestLiveActivity(),/Open the app/);
 assert.equal(h.factories.get('VelunivoNavigationTest')!.starts.length,0);
 h.state.currentState='active';await h.api.startTestLiveActivity();h.expire();
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.equal(h.factories.get('VelunivoNavigationTest')!.instances.length,0);
});

test('Lock Screen and expanded island render battery and spectators, and omit unavailable badges',()=>{
 const h=harness(),layout=h.layouts.get('VelunivoNavigation')!;
 const base={turn:'turn',distance:'100 m',arrival:'10:00',minutes:'5 min',remaining:'1 km',symbol:'arrow.up'};
 const visible=layout({...base,batteryPercent:56,batterySymbol:'battery.50percent',viewerCount:2},{isLuminanceReduced:false});
 for(const area of ['banner','expandedBottom']){const json=JSON.stringify(visible[area]);assert.match(json,/battery.50percent/);assert.match(json,/person.fill/);assert.match(json,/56/);}
 const absent=layout(base,{isLuminanceReduced:false});assert.doesNotMatch(JSON.stringify(absent.banner),/battery\.|person.fill/);
});
test('background GPS activity update retains current local battery and spectator fields',async()=>{
 const h=harness();let received:any;h.factories.get('VelunivoNavigation')!.instances.push({end:async()=>{},update:async(props:any)=>{received=props;}} as any);
 await h.api.updateRideActivity({}, {id:'vehicle'}, {liveActivities:true}, {arrived:false}, {timestamp:Date.now()});
 assert.equal(received.batteryPercent,56);assert.equal(received.viewerCount,2);assert.equal(received.turn,'turn');
});

test('paused guidance preserves last battery and spectators and marks the battery old',async()=>{const h=harness();let received:any;h.factories.get('VelunivoNavigation')!.instances.push({end:async()=>{},update:async(props:any)=>{received=props;}} as any);await h.api.updateRideActivity({}, {id:'vehicle'}, {liveActivities:true}, {arrived:false}, {timestamp:Date.now()});await h.api.markActivityPaused();assert.equal(received.batteryPercent,56);assert.equal(received.viewerCount,2);assert.equal(received.batteryOld,true);});
