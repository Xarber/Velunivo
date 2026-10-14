/** Run: node --import tsx scripts/benchmark-navigation.ts [baseline git revision]. */
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {estimate} from '../src/core/eta';
import {guidance} from '../src/core/navigation';
import {defaultProfile,Route,Fix} from '../src/core/types';
const directory=mkdtempSync(join(tmpdir(),'velunivo-nav-bench-'));
try{
 for(const name of ['geo','eta','navigation'])writeFileSync(join(directory,name+'.ts'),execFileSync('git',['show',`${process.argv[2]||'93cd711'}:src/core/${name}.ts`]));
 const beforeETA=(await import(pathToFileURL(join(directory,'eta.ts')).href)).estimate as typeof estimate,beforeGuidance=(await import(pathToFileURL(join(directory,'navigation.ts')).href)).guidance as typeof guidance;
 const points=20000,route:Route={id:'stress',name:'Stress fixture',kind:'bike',source:'valhalla',warnings:[],coordinates:Array.from({length:points},(_,i)=>[12+i*.00001,42]),steps:[{index:0,sign:0,text:'Continue',distance:0},{index:points-1,sign:4,text:'Arrived',distance:0}],details:{average_speed:Array.from({length:points-1},(_,i)=>[i,i+1,20]),max_speed:Array.from({length:points-1},(_,i)=>[i,i+1,25]),road_class:[],surface:[]}},profile={...defaultProfile,maxSpeed:25,ridingLimit:25,cruiseFactor:.8},fix:Fix={coordinate:route.coordinates[10000],accuracy:3,speed:6,timestamp:Date.now()};
 function bench(fn:()=>unknown){fn();const values=Array.from({length:15},()=>{const t=performance.now();fn();return performance.now()-t;}).sort((a,b)=>a-b);return {medianMs:+values[7].toFixed(3),p95Ms:+values[14].toFixed(3)};}
 console.log(JSON.stringify({points,guidance:{before:bench(()=>beforeGuidance(route,fix,8250)),after:bench(()=>guidance(route,fix,8250))},eta:{before:bench(()=>beforeETA(route,profile,5000)),after:bench(()=>estimate(route,profile,5000))}},null,2));
}finally{rmSync(directory,{recursive:true,force:true});}
