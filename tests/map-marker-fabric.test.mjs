import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
test('MapKit rotation patch forwards Fabric schema, C++ props and renderer and is idempotent',()=>{
 execFileSync(process.execPath,['scripts/patch-map-overlays.mjs']);
 const files=['src/specs/NativeComponentMarker.ts','ios/generated/RNMapsSpecs/Props.h','ios/generated/RNMapsSpecs/Props.cpp','ios/AirMaps/RNMapsMarkerView.mm','ios/AirMaps/AIRMapMarker.m'];
 const read=()=>files.map(f=>fs.readFileSync('node_modules/react-native-maps/'+f,'utf8'));
 const before=read();execFileSync(process.execPath,['scripts/patch-map-overlays.mjs']);assert.deepEqual(read(),before);
 assert.match(before[0],/rotation\?: WithDefault<Double, 0>/);
 assert.match(before[1],/double rotation\{0\.0\}/);
 assert.match(before[2],/rotation\(convertRawProp\(context, rawProps, "rotation"/);
 assert.match(before[3],/setVelunivoRotation:newViewProps.rotation/);
 assert.match(before[4],/self.velunivoRotation - self.map.camera.heading/);
});
