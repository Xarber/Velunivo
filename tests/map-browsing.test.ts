import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
test('user interaction renews an eight-second follow pause; sensor renders do not shorten or restart it',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});let cursor=0,resumed=0;const hooks:{value?:unknown;deps?:unknown[];cleanup?:()=>void}[]=[],effects:(()=>void)[]=[];
 const changed=(a:unknown[]|undefined,b:unknown[])=>!a||a.length!==b.length||a.some((v,i)=>v!==b[i]);
 const react={useRef:(value:unknown)=>{const slot=hooks[cursor++]??={value:{current:value}};return slot.value;},useCallback:(fn:()=>void,deps:unknown[])=>{const slot=hooks[cursor++]??={};if(changed(slot.deps,deps)){slot.deps=deps;slot.value=fn;}return slot.value;},useEffect:(fn:()=>void|(()=>void),deps:unknown[])=>{const slot=hooks[cursor++]??={};if(changed(slot.deps,deps)){slot.deps=deps;effects.push(()=>{slot.cleanup?.();slot.cleanup=fn()||undefined;});}}};
 const context={exports:{},require:()=>react,setTimeout,clearTimeout};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/useMapBrowsing.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
 const hook=(context.exports as {useMapBrowsing:(active:boolean,resume:()=>void)=>{touch():void;cancel():void}}).useMapBrowsing;
 const render=(active=true)=>{cursor=0;const value=hook(active,()=>resumed++);effects.splice(0).forEach(effect=>effect());return value;};
 let browser=render();browser.touch();t.mock.timers.tick(7000);assert.equal(resumed,0);browser=render();t.mock.timers.tick(999);assert.equal(resumed,0);t.mock.timers.tick(1);assert.equal(resumed,1);
 browser.touch();t.mock.timers.tick(7000);browser.touch();t.mock.timers.tick(1000);assert.equal(resumed,1);t.mock.timers.tick(7000);assert.equal(resumed,2);
 browser.touch();render(false);t.mock.timers.tick(10000);assert.equal(resumed,2);hooks.forEach(h=>h.cleanup?.());
});
