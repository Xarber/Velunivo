import {test} from 'node:test';
import assert from 'node:assert/strict';
import {replayMapPadding} from '../src/core/replayLayout';
test('portrait replay camera clears the measured expanded and collapsed panels',()=>{
 const insets={top:62,bottom:110,left:0,right:0};
 for(const panel of [230,540]){const p=replayMapPadding(402,874,insets,panel),center=p.top+(874-p.top-p.bottom)/2;assert.ok(center<874-insets.bottom-panel);assert.ok(874-p.top-p.bottom>=100);}
});
test('landscape and tablet replay keep position in the uncovered side of the map',()=>{
 for(const [w,h] of [[874,402],[834,1210],[1210,834]]){const p=replayMapPadding(w,h,{top:24,bottom:90,left:62,right:0},540),center=p.left+(w-p.left-p.right)/2;assert.ok(center>p.left);assert.ok(w-p.left-p.right>100);}
});
