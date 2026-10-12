import {buildSync} from 'esbuild';import {writeFileSync} from 'node:fs';
const bundled=buildSync({entryPoints:['src/groups/nativeEntry.ts'],bundle:true,write:false,platform:'browser',target:'es2020',minify:true});
writeFileSync('src/groups/groupRuntime.generated.ts','// Generated locally from the shared, tested GroupSession engine.\nexport const groupRuntime='+JSON.stringify(bundled.outputFiles[0].text)+';\n');
