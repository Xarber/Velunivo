import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
test('release identity accepts a complete Git SHA and never presents a placeholder as a real commit',()=>{
 const source=ts.transpileModule(fs.readFileSync('src/core/appVersion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 for(const [sha,expected] of [['ABCDEF0123456789ABCDEF0123456789ABCDEF01','abcdef0123456789abcdef0123456789abcdef01'],['short',null],['',null],[undefined,null]] as const){const context={exports:{},require:()=>({version:'2.1.1'}),process:{env:{EXPO_PUBLIC_COMMIT_SHA:sha}}};vm.runInNewContext(source,context);assert.equal((context.exports as {APP_COMMIT:unknown}).APP_COMMIT,expected);}
});
