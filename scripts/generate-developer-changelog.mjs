import {execFileSync} from 'node:child_process';import {readFileSync,writeFileSync} from 'node:fs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const current=process.env.APP_VERSION||JSON.parse(readFileSync('package.json','utf8')).version;
const tags=git('tag','--list','v*').split('\n').filter(t=>/^v\d+\.\d+\.\d+$/.test(t)).sort((a,b)=>{const x=a.slice(1).split('.').map(Number),y=b.slice(1).split('.').map(Number);return x[0]-y[0]||x[1]-y[1]||x[2]-y[2];});
const notes={};let previous;
for(const tag of tags){const raw=git('log','--reverse','--format=%H%x1f%s%x1f%b%x1e',previous?`${previous}..${tag}`:tag);notes[tag.slice(1)]=raw.split('\x1e').filter(s=>s.trim()).map(s=>{const [sha,title,body]=s.trim().split('\x1f');return {sha,title,body:body?.trim()||''};});previous=tag;}
if(!notes[current]){const raw=git('log','--reverse','--format=%H%x1f%s%x1f%b%x1e',previous?`${previous}..HEAD`:'HEAD');notes[current]=raw.split('\x1e').filter(s=>s.trim()).map(s=>{const [sha,title,body]=s.trim().split('\x1f');return {sha,title,body:body?.trim()||''};});}
writeFileSync('src/core/developerReleaseNotes.json',JSON.stringify(notes,null,2)+'\n');
