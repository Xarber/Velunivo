// Bundle the installed MIT PeerJS release locally; no runtime CDN or remote code.
import {readFileSync,writeFileSync} from 'node:fs';
const license=readFileSync(new URL('../node_modules/peerjs/LICENSE',import.meta.url),'utf8');
const js='/* '+license.replaceAll('*/','* /')+' */\n'+readFileSync(new URL('../node_modules/peerjs/dist/peerjs.min.js',import.meta.url),'utf8');
writeFileSync(new URL('../src/sharing/peerRuntime.generated.ts',import.meta.url),`// Generated from the installed PeerJS MIT distribution by postinstall.\nexport const peerRuntime = ${JSON.stringify(js)};\n`);
