import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness() {
 const factories=new Map<string,{instances:{end:(policy:string)=>Promise<void>}[];starts:unknown[][]}>();
 let timeout:(()=>void)|undefined;
 const state={currentState:'active'};
 const mocks:Record<string,unknown>={react:{},'react-native':{AppState:state},'./activityInstallation':{inspectActivityInstallation:()=>null},'../core/activityDiagnostics':{activityDiagnosis:()=>''},'@expo/ui/swift-ui':{},'@expo/ui/swift-ui/modifiers':{},'../core/liveActivity':{},'../core/navigation':{},'expo-widgets':{createLiveActivity:(name:string)=>{
  const f={instances:[] as {end:(policy:string)=>Promise<void>}[],starts:[] as unknown[][]};factories.set(name,f);
  return {getInstances:()=>f.instances,start:(...args:unknown[])=>{f.starts.push(args);const live={end:async(policy:string)=>{assert.equal(policy,'immediate');f.instances=f.instances.filter(i=>i!==live);}};f.instances.push(live);return live;}};}}};
 const context={exports:{},require:(name:string)=>{assert.ok(name in mocks,name);return mocks[name];},setTimeout:(fn:()=>void)=>{timeout=fn;return 1;},clearTimeout:()=>{timeout=undefined;},Date};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/useNavigationActivity.ios.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,context);
 return {api:context.exports as {startTestLiveActivity:()=>Promise<{activeCount:number}>;stopTestLiveActivity:()=>Promise<void>},factories,state,expire:()=>timeout?.()};
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
