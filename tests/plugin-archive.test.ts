import {test} from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
import {parsePluginArchive,compilePluginModules} from '../src/plugins/archive';
const info={schema:1,api:1,id:'test.archive',name:'Test',version:'1.0.0',description:'Example',permissions:['ui.cards'],entry:'src/main.js'};
function archive(files:Record<string,string>,meta:unknown=info){return zipSync(Object.fromEntries(Object.entries({'info.json':JSON.stringify(meta),...files}).map(([k,v])=>[k,strToU8(v)])));}
test('VPI metadata contains no code and local libraries resolve in an async entry',async()=>{
 const pkg=parsePluginArchive(archive({'src/main.js':"const math=require('../lib/math'); await api.save(math.double(require('../lib/data.json').value));",'lib/math.js':'exports.double=value=>value*2;','lib/data.json':'{"value":21}'}));
 let result=0;await new Function('api','return (async()=>{'+pkg.code+'})();')({save:(v:number)=>{result=v;}});assert.equal(result,42);
});
test('module cache supports cycles and refuses native, bare, remote and escaping imports',async()=>{
 for(const id of ['react-native','fs','https://example.test/lib.js','../../outside']){
  const code=compilePluginModules({'src/main.js':`require(${JSON.stringify(id)})`},'src/main.js');await assert.rejects(()=>new Function('api','return (async()=>{'+code+'})();')({}));
 }
 const code=compilePluginModules({'main.js':"if(require('./a').b!==3)throw Error('cycle failed');",'a.js':"exports.a=2;exports.b=require('./b').b;",'b.js':"exports.b=require('./a').a+1;"},'main.js');await new Function('api','return (async()=>{'+code+'})();')({});
});
test('archives reject path traversal, unsupported executables, missing entries and embedded manifest code',()=>{
 for(const files of ([{'../bad.js':'x'},{'/bad.js':'x'},{'lib\\bad.js':'x'},{'lib/a.wasm':'x'},{'bad.html':'x'}] as Record<string,string>[]))assert.throws(()=>parsePluginArchive(archive({'src/main.js':'1',...files})));
 assert.throws(()=>parsePluginArchive(archive({})));
 assert.throws(()=>parsePluginArchive(archive({'src/main.js':'1'},{...info,code:'evil'})));
 assert.throws(()=>parsePluginArchive(archive({'src/main.js':'1'},{...info,icon:'https://example.test/icon.png'})));
 assert.throws(()=>parsePluginArchive(archive({'src/main.js':'1','assets/icon.png':'not a PNG'},{...info,icon:'assets/icon.png'})));
});
test('archives bound compressed size, expanded size and file count before evaluation',()=>{
 assert.throws(()=>parsePluginArchive(new Uint8Array(512001)));
 assert.throws(()=>parsePluginArchive(archive({'src/main.js':'1','huge.txt':'a'.repeat(1000001)})));
 assert.throws(()=>parsePluginArchive(archive(Object.fromEntries(Array.from({length:65},(_,i)=>[`lib/${i}.js`,'1'])))));
 assert.throws(()=>parsePluginArchive(new Uint8Array([80,75,0])));
});
test('packaging never lets plugin JavaScript escape the runtime HTML',async()=>{
 const {sandboxDocument}=await import('../src/plugins/sandbox');const pkg=parsePluginArchive(archive({'src/main.js':`throw Error('</script><img src="https://evil.test">');`}));
 const html=sandboxDocument(pkg.code,'token');assert.equal((html.match(/<\/script>/gi)||[]).length,1);assert.match(html,/connect-src 'none'/);
});
test('duplicate ZIP paths are rejected rather than silently replacing source',()=>{
 const bytes=archive({'src/main.js':'1','lib/a.js':'2','lib/b.js':'3'});
 const from=strToU8('lib/b.js'),to=strToU8('lib/a.js');
 for(let i=0;i<=bytes.length-from.length;i++)if(from.every((value,j)=>bytes[i+j]===value))bytes.set(to,i);
 assert.throws(()=>parsePluginArchive(bytes),/Invalid plugin archive/);
});
