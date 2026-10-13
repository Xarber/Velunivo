import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {applyPatch,patchSources} from '../scripts/patch-widgets.mjs';
test('installed widget renders all Velunivo factories directly before touching shared storage',()=>{
 const utils=fs.readFileSync('node_modules/expo-widgets/ios/Widgets/Utils.swift','utf8');
 const body=utils.slice(utils.indexOf('func getLiveActivityNodes('));
 assert.ok(body.indexOf('name == "VelunivoNavigation" || name == "VelunivoNavigationTest" || name == "VelunivoSharedTrip"') < body.indexOf('let layout = WidgetsStorage'));
 assert.match(body,/return \["__velunivo_native": true\]/);
 const views=fs.readFileSync('native/VelunivoActivityViews.swift','utf8');
 assert.match(views,/JSONSerialization.jsonObject/);
 for(const key of ['turn','symbol','distance','arrival','minutes','remaining'])assert.ok(views.includes(`values["${key}"]`));
 const widget=fs.readFileSync('node_modules/expo-widgets/ios/Widgets/WidgetLiveActivity.swift','utf8');
 assert.match(widget,/VelunivoActivitySection\(context: context/);
 assert.match(widget,/VelunivoActivityBanner\(context: context\)/);
 assert.match(widget,/else if #available\(iOS 18.0/,'normal Expo rendering remains for other factories');
 assert.match(widget,/banner.widgetURL\(url\)/,'deep links are preserved');
});
test('patch is repeatable and refuses unreviewed upstream versions',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'velunivo-widgets-test-'));
 try {
  fs.mkdirSync(path.join(root,'native'));fs.copyFileSync('native/VelunivoActivityViews.swift',path.join(root,'native/VelunivoActivityViews.swift'));
  const dir=path.join(root,'node_modules/expo-widgets');fs.mkdirSync(path.join(dir,'ios/Widgets'),{recursive:true});
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({version:'57.0.23'}));
  for(const name of ['WidgetLiveActivity.swift','Utils.swift'])fs.copyFileSync(`node_modules/expo-widgets/ios/Widgets/${name}`,path.join(dir,'ios/Widgets',name));
  const utilsFile=path.join(dir,'ios/Widgets/Utils.swift');fs.writeFileSync(utilsFile,fs.readFileSync(utilsFile,'utf8').replace(' || name == "VelunivoSharedTrip"',''));
  applyPatch(root);assert.match(fs.readFileSync(utilsFile,'utf8'),/name == "VelunivoSharedTrip"/);const before=fs.readFileSync(path.join(dir,'ios/Widgets/WidgetLiveActivity.swift'),'utf8');applyPatch(root);
  assert.equal(fs.readFileSync(path.join(dir,'ios/Widgets/WidgetLiveActivity.swift'),'utf8'),before);
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({version:'57.0.24'}));assert.throws(()=>applyPatch(root),/Review native activity patch/);
  assert.throws(()=>patchSources('changed','changed',''),/source changed/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('native patch is installed during clean CI install and cannot be replaced with a precompiled module',()=>{
 const p=JSON.parse(fs.readFileSync('package.json','utf8'));
 assert.equal(p.dependencies['expo-widgets'],'57.0.23');
 assert.ok(p.scripts.postinstall.includes('node scripts/patch-widgets.mjs'));
 assert.deepEqual(p.expo.autolinking.ios.buildFromSource,['^expo-widgets$']);
 assert.equal(JSON.parse(fs.readFileSync('app.json','utf8')).expo.ios.infoPlist.VelunivoNativeActivityRenderer,true);
});

test('native battery and viewer badges consume mixed JSON props and support OS-driven stale state',()=>{const views=fs.readFileSync('native/VelunivoActivityViews.swift','utf8');for(const key of ['batteryPercent','batteryUpdatedAt','batteryOld','viewerCount','oldLabel'])assert(views.includes(`values["${key}"]`));assert.match(views,/context.isStale/);assert.match(views,/Text\(date, style: .relative\)/);assert.match(views,/old \? .orange/);assert.match(views,/VelunivoActivityBadges\(data: data, stale: velunivoActivityIsStale\(context\)\)/);});
