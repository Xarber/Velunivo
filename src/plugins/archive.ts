/** VPI is an ordinary ZIP. Never extracts files or executes code during inspection. */
import {strFromU8,unzipSync} from 'fflate';
import {parsePlugin,PluginPackage} from './model';
export const MAX_PLUGIN_ARCHIVE=512000;
const MAX_EXPANDED=1000000;
function fail():never{throw new Error('Invalid plugin archive.');}
function path(value:string){return value.length<=180&&!value.startsWith('/')&&!value.includes('\\')&&!value.includes(':')&&value.split('/').every(p=>p!=='.'&&p!=='..'&&/^[a-zA-Z0-9_.-]+$/.test(p));}
function decode(bytes:Uint8Array){try{return strFromU8(bytes);}catch{return fail();}}
/** Local CommonJS modules only. Bundlers may emit a single entry; no native/remote imports. */
export function compilePluginModules(files:Record<string,string>,entry:string){
 const sources=JSON.stringify(files);
 return `const files=${sources},cache=Object.create(null);function resolve(from,id){if(typeof id!=='string'||!id.startsWith('.'))throw new Error('Only local plugin libraries are supported');const parts=from.split('/');parts.pop();for(const part of id.split('/')){if(part==='..'){if(!parts.length)throw new Error('Invalid module path');parts.pop();}else if(part!=='.'&&part!=='')parts.push(part);}const base=parts.join('/');for(const name of [base,base+'.js',base+'.json',base+'/index.js'])if(Object.prototype.hasOwnProperty.call(files,name))return name;throw new Error('Plugin library not found');}function load(name){if(cache[name])return cache[name].exports;const module={exports:{}};cache[name]=module;if(name.endsWith('.json'))module.exports=JSON.parse(files[name]);else new Function('api','require','module','exports',files[name])(api,id=>load(resolve(name,id)),module,module.exports);return module.exports;}const module={exports:{}};cache[${JSON.stringify(entry)}]=module;await new Function('api','require','module','exports','return (async()=>{\\n'+files[${JSON.stringify(entry)}]+'\\n})();')(api,id=>load(resolve(${JSON.stringify(entry)},id)),module,module.exports);`;
}
function inspectArchive(bytes:Uint8Array):PluginPackage{
 if(bytes.length>MAX_PLUGIN_ARCHIVE)throw new Error('Plugin package is too large.');
 if(bytes.length<22||bytes[0]!==80||bytes[1]!==75)fail();
 let expanded=0,count=0;const names=new Set<string>();
 // fflate consults central-directory sizes before inflation. Reject bombs and duplicate paths.
 const contents=unzipSync(bytes,{filter:file=>{
  const name=file.name;if(++count>64||names.has(name)||!path(name.replace(/\/$/,'')))fail();names.add(name);
  if(file.originalSize>MAX_EXPANDED||(expanded+=file.originalSize)>MAX_EXPANDED)throw new Error('Plugin package is too large.');
  if(name.endsWith('/'))return false;
  if(!/\.(js|json|png|md|txt|LICENSE)$/i.test(name)&&!/(^|\/)LICENSE$/.test(name))fail();
  return true;
 }});
 if(!contents['info.json']||contents['info.json'].length>16000)fail();
 const info=JSON.parse(decode(contents['info.json']));
 if(!info||info.schema!==1||'code' in info||typeof info.entry!=='string'||!path(info.entry)||!info.entry.endsWith('.js')||!contents[info.entry])fail();
 const modules:Record<string,string>=Object.create(null);let codeSize=0;
 for(const [name,body] of Object.entries(contents))if(name!== 'info.json'&&/\.(js|json)$/.test(name)){codeSize+=body.length;if(codeSize>200000)throw new Error('Plugin package is too large.');modules[name]=decode(body);if(name.endsWith('.json'))JSON.parse(modules[name]);}
 let icon:string|undefined;
 if(info.icon!==undefined){
  if(typeof info.icon!=='string'||!path(info.icon)||!info.icon.endsWith('.png'))fail();
  const png=contents[info.icon];if(!png||png.length>65536||png.length<33||![137,80,78,71,13,10,26,10].every((v,i)=>png[i]===v)||String.fromCharCode(...png.slice(12,16))!=='IHDR')fail();
  const view=new DataView(png.buffer,png.byteOffset,png.byteLength),w=view.getUint32(16),h=view.getUint32(20);if(w<1||h<1||w>512||h>512)fail();
  let binary='';for(const b of png)binary+=String.fromCharCode(b);icon='data:image/png;base64,'+btoa(binary);
 }
 return parsePlugin({...info,code:compilePluginModules(modules,info.entry),icon});
}

export function parsePluginArchive(bytes:Uint8Array):PluginPackage{
 try{return inspectArchive(bytes);}catch(error){
  if(error instanceof Error&&['Plugin package is too large.','This plugin needs a different app API version.','Invalid plugin identity.','Invalid plugin code or description.','Unsupported plugin permission.'].includes(error.message))throw error;
  return fail();
 }
}
