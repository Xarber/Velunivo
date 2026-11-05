// SPDX-License-Identifier: AGPL-3.0-only
// Read local exports only; never fetch or publish private ideas automatically.
import fs from 'node:fs';
import {ideasDocument,parseIdeas,reviewIdeas,mergeIdeas} from '../src/developer/ideas/model';
const target='docs/IDEAS.json';
const reviewPath='docs/IDEAS_REVIEW.json';
const lastReview=fs.existsSync(reviewPath)?JSON.parse(fs.readFileSync(reviewPath,'utf8')).reviewedAt:null;
const current=parseIdeas(fs.readFileSync(target,'utf8'));
const [command,file,...flags]=process.argv.slice(2);
if(!command||command==='list'){
 const counts=Object.fromEntries(['Pending','Approved','Deferred','In Progress'].map(s=>[s,current.ideas.filter(i=>!i.deleted&&i.status===s).length]));
 console.log(JSON.stringify({counts,lastReviewedAt:lastReview,newSinceLastReview:current.ideas.filter(i=>!i.deleted&&(!lastReview||i.at>lastReview)).length,ideas:current.ideas.filter(i=>!i.deleted).map(i=>({id:i.id,title:i.title,status:i.status,updatedAt:i.at}))},null,2));
}else if(command==='review'){
 fs.writeFileSync(reviewPath,JSON.stringify({schema:1,reviewedAt:Date.now()},null,2)+'\n');console.log('Recorded local review time. Idea statuses were not changed.');
}else if(command==='import'&&file){
 if(fs.statSync(file).size>5_000_000)throw Error('Ideas file exceeds 5 MB.');
 const incoming=parseIdeas(fs.readFileSync(file,'utf8'));
 const review=reviewIdeas(current.ideas,incoming.ideas);console.log(JSON.stringify(review.map(r=>({id:r.idea.id,title:r.idea.title,kind:r.kind,status:r.idea.status})),null,2));
 if(flags.includes('--apply')){
  const accepted=new Set(flags.filter(f=>f.startsWith('--accept=')).map(f=>f.slice(9)));
  const next=JSON.stringify(ideasDocument(mergeIdeas(current.ideas,incoming.ideas,accepted)),null,2)+'\n';
  fs.writeFileSync(target+'.tmp',next);fs.renameSync(target+'.tmp',target);console.log('Merged locally. Review the diff before committing; do not publish private ideas.');
 }else console.log('Review only. Use --apply to add new ideas; --accept=ID explicitly accepts a conflicting incoming version.');
}else throw Error('Usage: tsx scripts/ideas.ts list | import FILE [--apply] [--accept=ID]');
