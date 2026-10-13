import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
test('moving viewports repaint during the gesture, coalesce rapid updates and cancel on unmount',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const updates:number[][]=[];let cleanup:(()=>void)|undefined;
 const react={useState:(initial:number[])=>[initial,(fn:(old:number[])=>number[])=>updates.push(fn(updates.at(-1)||initial))],useRef:(value:unknown)=>({current:value}),useCallback:(fn:unknown)=>fn,useEffect:(fn:()=>()=>void)=>{cleanup=fn();}};
 const context={exports:{},require:()=>react,setTimeout,clearTimeout,Number,Math};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/useScratchViewport.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
 const {update}=(context.exports as {useScratchViewport():{update(bounds:number[]):void}}).useScratchViewport();
 update([9,45,10,46]);update([10,45,11,46]);t.mock.timers.tick(119);assert.equal(updates.length,0);t.mock.timers.tick(1);assert.deepEqual(updates[0],[10,45,11,46]);
 update([11,45,12,46]);t.mock.timers.tick(120);assert.deepEqual(updates[1],[11,45,12,46]);update([NaN,45,12,46]);t.mock.timers.tick(120);assert.equal(updates.length,2);
 update([12,45,13,46]);cleanup?.();t.mock.timers.tick(120);assert.equal(updates.length,2);
});
