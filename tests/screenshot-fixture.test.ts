import test from 'node:test';
import assert from 'node:assert/strict';
import route from '../scripts/screenshot-route.json';
test('public screenshot route has valid geometry and real indexed turn instructions',()=>{
 assert.equal(route.source,'valhalla');assert.equal(route.kind,'bike');assert.ok(route.coordinates.length>50);assert.ok(route.steps.length>5);
 for(const p of route.coordinates){assert.equal(p.length,2);assert.ok(p.every(Number.isFinite));assert.ok(p[0]>9.1&&p[0]<9.3&&p[1]>45.4&&p[1]<45.6);}
 for(const s of route.steps){assert.ok(s.index>=0&&s.index<route.coordinates.length);assert.ok(s.text.length>0);}
});
