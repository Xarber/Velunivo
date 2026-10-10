import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {getDefaultConfig}=require('expo/metro-config');
const {resolve}=require('metro-resolver');
const config=getDefaultConfig(process.cwd());
function modulePath(origin,request,platform) {
 const result=resolve({
  ...config.resolver,assetExts:new Set(config.resolver.assetExts),
  originModulePath:path.resolve(origin),preferNativePlatform:platform!=='web',
  redirectModulePath:p=>p,getPackageForModule:()=>null,getPackage:()=>null,
  fileSystemLookup:p=>{try{const s=fs.statSync(p);return {exists:true,type:s.isDirectory()?'d':'f',realPath:fs.realpathSync(p)};}catch{return {exists:false};}},
  doesFileExist:p=>fs.existsSync(p),resolveAsset:()=>null,
 },request,platform);
 assert.equal(result.type,'sourceFile');return path.relative(process.cwd(),result.filePath);
}
test('Metro selects native iOS Live Activity service for Settings and ride subscriptions',()=>{
 for(const [origin,request] of [['src/components/ActivityDiagnostics.tsx','../services/useNavigationActivity'],['src/services/useRide.ts','./useNavigationActivity']]) {
  assert.equal(modulePath(origin,request,'ios'),'src/services/useNavigationActivity.ios.tsx');
  for(const platform of ['android','web'])assert.equal(modulePath(origin,request,platform),'src/services/useNavigationActivity.tsx');
 }
});
test('Metro selects native SF Symbol position marker only on iOS',()=>{
 assert.equal(modulePath('src/components/RideMap.tsx','./PositionArrow','ios'),'src/components/PositionArrow.ios.tsx');
 for(const platform of ['android','web'])assert.equal(modulePath('src/components/RideMap.tsx','./PositionArrow',platform),'src/components/PositionArrow.tsx');
});
