// node scripts/package-plugin.mjs examples/plugins/installable-demo [output.vpi]
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve,relative,join} from 'node:path';
import {zipSync} from 'fflate';
const root=resolve(process.argv[2]||'examples/plugins/installable-demo');
const files=Object.create(null);
async function collect(folder){for(const item of await readdir(folder,{withFileTypes:true})){const full=join(folder,item.name),name=relative(root,full).split('\\').join('/');if(item.isSymbolicLink())throw Error('Symlinks are not allowed');if(item.isDirectory())await collect(full);else files[name]=new Uint8Array(await readFile(full));}}
await collect(root);
const {parsePluginArchive}=await import('../src/plugins/archive.ts');
const archive=zipSync(files,{level:6});const pkg=parsePluginArchive(archive);
const output=resolve(process.argv[3]||join(root,'..',pkg.id+'.vpi'));
await writeFile(output,archive);console.log(`${pkg.name}: ${archive.length} bytes → ${output}`);
