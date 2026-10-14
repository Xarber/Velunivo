import test from 'node:test';import assert from 'node:assert/strict';
import {TravelHeadingTracker} from '../src/core/travelHeading';import {Fix} from '../src/core/types';
const base=1_800_000_000_000,fallback={heading:90,source:'Route direction'};
const fix=(second:number,heading=90,speed=5,accuracy=5):Fix=>({coordinate:[second*.00004,45],timestamp:base+second*1000,heading,speed,accuracy});
function next(t:TravelHeadingTracker,s:number,compass=270,heading=90,speed=5,accuracy=5){return t.next(fix(s,heading,speed,accuracy),{heading:compass,timestamp:base+s*1000},true,fallback,base+s*1000);}
test('compass stays primary for short disagreement, then persistent moving mismatch uses travel direction',()=>{const t=new TravelHeadingTracker();for(let s=0;s<8;s++){assert.equal(next(t,s).heading,270);}assert.equal(next(t,8).heading,90);assert.equal(next(t,9).travelOverride,true);});
test('brief alignment does not flap; five agreeing seconds restore compass',()=>{const t=new TravelHeadingTracker();for(let s=0;s<=8;s++)next(t,s);for(let s=9;s<14;s++)assert.equal(next(t,s,95).travelOverride,true);assert.equal(next(t,14,95).travelOverride,false);});
test('stopping restores compass only after five seconds and poor GPS cannot trigger an override',()=>{const t=new TravelHeadingTracker();for(let s=0;s<20;s++)assert.equal(next(t,s,270,90,5,50).travelOverride,false);for(let s=20;s<=28;s++)next(t,s);assert.equal(next(t,29,270,90,0).travelOverride,true);assert.equal(next(t,34,270,90,0).travelOverride,false);});
test('matching headings across north do not count as a mismatch; compass disabled falls back to course',()=>{const t=new TravelHeadingTracker();for(let s=0;s<15;s++)assert.equal(next(t,s,355,5).travelOverride,false);assert.equal(t.next(fix(16),{heading:270,timestamp:base+16000},false,fallback,base+16000).heading,90);});
test('a persistent mismatch interrupted by accurate agreement resets the eight-second timer',()=>{const t=new TravelHeadingTracker();for(let s=0;s<7;s++)next(t,s);next(t,7,90);for(let s=8;s<16;s++)assert.equal(next(t,s).travelOverride,false);assert.equal(next(t,16).travelOverride,true);});
test('reliable sustained displacement can establish travel direction when GPS speed is missing',()=>{const t=new TravelHeadingTracker();let result;for(let s=0;s<=16;s+=2){result=t.next({...fix(s),speed:null,heading:undefined},{heading:270,timestamp:base+s*1000},true,fallback,base+s*1000);}assert.equal(result?.travelOverride,true);});
test('an upcoming route tangent cannot turn the map before physical movement turns',()=>{
 const tracker=new TravelHeadingTracker(),start:Fix={coordinate:[12,42],speed:5,accuracy:2,timestamp:base};
 const empty={heading:null,timestamp:0};assert.equal(tracker.next(start,empty,false,{heading:0,source:'Route direction'},base).heading,0);
 // No reliable displacement/course yet; snapping to the next route segment is not turn evidence.
 assert.equal(tracker.next({...start,timestamp:base+1000},empty,false,{heading:90,source:'Route direction'},base+1000).heading,0);
 // Move north first, then east: course comes from observed GPS movement after the actual corner.
 tracker.next({...start,coordinate:[12,42.0001],timestamp:base+2000},empty,false,{heading:90,source:'Route direction'},base+2000);
 const turned=tracker.next({...start,coordinate:[12.00015,42.0001],timestamp:base+5000},empty,false,{heading:90,source:'Route direction'},base+5000);assert(Math.abs(turned.heading-90)<2);
});
test('compass and route pointing into a corner wait for a real change of travel direction',()=>{
 const tracker=new TravelHeadingTracker(),f=(s:number,c:[number,number],heading:number):Fix=>({coordinate:c,speed:5,accuracy:2,timestamp:base+s*1000,heading}),compass=(s:number,h:number)=>({heading:h,timestamp:base+s*1000});
 tracker.next(f(0,[12,42],0),compass(0,0),true,{heading:0,source:'Route direction'},base);
 tracker.next(f(1,[12,42.00005],0),compass(1,0),true,{heading:0,source:'Route direction'},base+1000);
 assert.equal(tracker.next(f(2,[12,42.0001],0),compass(2,90),true,fallback,base+2000).heading,0);
 assert.equal(tracker.next(f(3,[12.0001,42.0001],90),compass(3,90),true,fallback,base+3000).heading,90);
});
test('small compass changes cannot accumulate into an anticipated turn while the GPS path stays straight',()=>{
 const tracker=new TravelHeadingTracker();let output=0;for(let s=0;s<=6;s++){const f:Fix={coordinate:[12,42+s*.00005],speed:5,accuracy:2,heading:0,timestamp:base+s*1000};output=tracker.next(f,{heading:s*15,timestamp:f.timestamp},true,fallback,f.timestamp).heading;}assert(output<=8);
 const turned:Fix={coordinate:[12.0001,42.0003],speed:5,accuracy:2,heading:90,timestamp:base+7000};assert.equal(tracker.next(turned,{heading:90,timestamp:turned.timestamp},true,fallback,turned.timestamp).heading,90);
});
