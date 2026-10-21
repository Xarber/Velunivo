import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parsePlugin,packageUrl,pluginCard,pluginAccent,permitted} from '../src/plugins/model';
import {bundledPlugins} from '../src/plugins/examples';
import {parsePluginArchive} from '../src/plugins/archive';
import {sandboxDocument} from '../src/plugins/sandbox';

test('every extension example has a valid, identical downloadable package',()=>{
 const permissions=new Set<string>();
 for(const example of bundledPlugins){assert.deepEqual(parsePlugin(example),example);for(const permission of example.permissions)permissions.add(permission);const archive=parsePluginArchive(new Uint8Array(readFileSync(`examples/plugins/${example.id.replace('example.','')}.vpi`)));assert.equal(archive.id,example.id);assert.deepEqual(archive.permissions,example.permissions);assert.ok(archive.icon);}
 assert.equal(permissions.size,6);
});
test('packages reject unsupported APIs, oversized code, unknown permissions and invalid identities',()=>{
 const sample=bundledPlugins[0];
 for(const change of [{api:2},{schema:0},{id:'../../credentials'},{name:''},{version:'latest'},{code:'x'.repeat(220001)},{permissions:['bluetooth.write']},{permissions:['storage','secrets.read']}])assert.throws(()=>parsePlugin({...sample,...change}));
 assert.equal(permitted(sample,'app.read'),true);assert.equal(permitted(sample,'vehicle.telemetry'),false);
});
test('package sources normalize GitHub safely and require HTTPS',()=>{
 assert.equal(packageUrl('author/project'),'https://raw.githubusercontent.com/author/project/main/velunivo.vpi');
 assert.equal(packageUrl('https://github.com/author/project/blob/testing/example.json'),'https://raw.githubusercontent.com/author/project/testing/example.json');
 assert.equal(packageUrl('https://example.test/plugin.json'),'https://example.test/plugin.json');
 for(const url of ['http://example.test/a','javascript:alert(1)','file:///a','https://password@example.test/a'])assert.throws(()=>packageUrl(url));
});
test('extension UI remains declarative and bounded',()=>{
 assert.equal(pluginCard({id:'demo',slot:'ride',title:'Power',text:'100 W'}).slot,'ride');
 for(const value of [{id:'a',slot:'ride',title:'x',text:'x'.repeat(601)},{id:'a',slot:'secrets',title:'x',text:'y'},{id:'a',slot:'home',title:'x',text:'y',action:{id:'x',label:'x'.repeat(81)}}])assert.throws(()=>pluginCard(value));
 assert.deepEqual(pluginAccent({light:'#abcdef',dark:'#123456'}),{light:'#abcdef',dark:'#123456'});assert.throws(()=>pluginAccent({light:'url(evil)',dark:'#123456'}));
});
test('plugin source cannot break out of its HTML script and networking is denied by CSP',()=>{
 const html=sandboxDocument(`throw new Error('</script><img src="https://example.invalid/">');`,'session');
 assert.equal((html.match(/<\/script>/gi)||[]).length,1);
 assert.match(html,/connect-src 'none'/);assert.match(html,/worker-src blob:/);assert.match(html,/new Worker/);
});
