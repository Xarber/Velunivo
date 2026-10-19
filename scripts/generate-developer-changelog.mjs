import {execFileSync} from 'node:child_process';import {readFileSync,writeFileSync,renameSync} from 'node:fs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const current=process.env.APP_VERSION||JSON.parse(readFileSync('package.json','utf8')).version;
const selected=new Map();
for(const tag of git('tag','--list','v*').split('\n')){const match=/^v(\d+\.\d+\.\d+)(?:-testing\.(\d+))?$/.exec(tag);if(!match)continue;const version=match[1],rank=match[2]===undefined?Infinity:Number(match[2]),old=selected.get(version);if(!old||rank>old.rank)selected.set(version,{tag,rank});}
const tags=[...selected].sort(([a],[b])=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);return x[0]-y[0]||x[1]-y[1]||x[2]-y[2];}).map(([version,{tag}])=>({version,tag}));
const target='src/core/developerReleaseNotes.json';let notes={};try{notes=JSON.parse(readFileSync(target,'utf8'));}catch{/* First generation has no retained history. */}

function describeCommit(sha,title){
 const files=git('diff-tree','--no-commit-id','--name-only','-r',sha).split('\n').filter(Boolean);
 const action=title.replace(/^[a-z]+(?:\([^)]*\))?!?:\s*/,'');
 return action+'.'+(files.length?' Changed '+files.length+' files: '+files.slice(0,8).join(', ')+(files.length>8?' and '+(files.length-8)+' more.':'.'):'');
}
let previous;
for(const {version,tag} of tags){const raw=git('log','--reverse','--format=%H%x1f%s%x1f%b%x1e',previous?`${previous}..${tag}`:tag);notes[version]=raw.split('\x1e').filter(s=>s.trim()).map(s=>{const [sha,title,body]=s.trim().split('\x1f');return {sha,title,body:body?.trim()||describeCommit(sha,title),releaseCommit:git('rev-parse',tag+'^{}')};});previous=tag;}
// Always rebuild the current release from the previous VERSION, even after its
// tag is pinned or an earlier testing build left a retained entry behind.
const beforeCurrent=version=>{const a=version.split('.').map(Number),b=current.split('.').map(Number);for(let i=0;i<3;i++)if(a[i]!==b[i])return a[i]<b[i];return false;};
const baseline=tags.filter(item=>beforeCurrent(item.version)).at(-1)?.tag;
{const raw=git('log','--reverse','--format=%H%x1f%s%x1f%b%x1e',baseline?`${baseline}..HEAD`:'HEAD');notes[current]=raw.split('\x1e').filter(s=>s.trim()).map(s=>{const [sha,title,body]=s.trim().split('\x1f');return {sha,title,body:body?.trim()||describeCommit(sha,title),releaseCommit:git('rev-parse','HEAD')};});}
writeFileSync('src/core/buildIdentity.generated.json',JSON.stringify({version:current,commit:git('rev-parse','HEAD')})+'\n');
const temporary=target+'.tmp';writeFileSync(temporary,JSON.stringify(notes,null,2)+'\n');renameSync(temporary,target);
