import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centerSquare } from '../src/core/vehiclePicture';
test('vehicle pictures retain a centered square across portrait, landscape and odd dimensions', () => {
 assert.deepEqual(centerSquare(1200,800), {originX:200,originY:0,width:800,height:800});
 assert.deepEqual(centerSquare(801,1202), {originX:0,originY:200,width:801,height:801});
 assert.deepEqual(centerSquare(512,512), {originX:0,originY:0,width:512,height:512});
 assert.throws(()=>centerSquare(0,200)); assert.throws(()=>centerSquare(NaN,200));
});
