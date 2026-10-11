import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import vm from 'node:vm';
import {pinFromBytes,PIN_PATTERN,sharedRoute,sharedProgress,parseTripMessage,routeLink,readRouteLink} from '../src/sharing/model';
import {PeerSession} from '../src/sharing/PeerSession';
import {nativePeerHtml} from '../src/sharing/nativePeerHtml';
import {redirectSystemPath} from '../src/app/+native-intent';
import type {Route} from '../src/core/types';
const route:Route={id:'private',name:'Bicycle candidate',kind:'bike',source:'valhalla',coordinates:[[9.19,45.464],[9.179,45.47]],startLabel:'Duomo, Milan',endLabel:'Sforza Castle, Milan',steps:[],details:{max_speed:[[0,1,50]],battery:[[0,1,76]]},warnings:[]};
const pin=pinFromBytes(new Uint8Array(20).fill(7));
class Connection extends EventEmitter {open=false;sent:any[]=[];closed=false;send(m:unknown){this.sent.push(m);}close(){this.closed=true;this.emit('close');}}
class FakePeer extends EventEmitter {destroyed=false;connection=new Connection();connect(){return this.connection;}destroy(){this.destroyed=true;}}
test('20-character random session codes and outbound privacy whitelist',()=>{
 assert(PIN_PATTERN.test(pin));assert.equal(pin.length,20);assert.throws(()=>pinFromBytes(new Uint8Array(19)));
 assert.deepEqual(Object.keys(sharedRoute(route)).sort(),['coordinates','endLabel','startLabel']);
 const m=sharedProgress([9.19,45.464],600,2000,100000);
 assert.deepEqual(Object.keys(m).sort(),['arrivalAt','metersLeft','position','secondsLeft','updatedAt']);
 assert.equal(m.arrivalAt,700000);
 const clean=parseTripMessage({type:'progress',progress:{...m,speed:123,battery:76,telemetry:{secret:true},speedLimit:25}});
 assert.deepEqual(clean,{type:'progress',progress:m});
 assert(!JSON.stringify(sharedRoute(route)).includes('battery'));assert(!JSON.stringify(sharedRoute(route)).includes('max_speed'));
});
test('untrusted peer data is bounded and only valid route / progress messages survive',()=>{
 assert.equal(parseTripMessage({type:'progress',progress:{position:[181,0],secondsLeft:10,metersLeft:10,updatedAt:10,arrivalAt:10}}),null);
 assert.equal(parseTripMessage({type:'route',route:{coordinates:Array(20001).fill([0,0]),startLabel:'a',endLabel:'b'}}),null);
 assert.equal(parseTripMessage({type:'command',action:'start navigation'}),null);
 assert.equal(parseTripMessage({type:'progress',progress:{...sharedProgress(null,10,10,10),secondsLeft:Infinity}}),null);
 assert.deepEqual(parseTripMessage({type:'ended',private:'ignored'}),{type:'ended'});
});
test('route links preserve endpoints and labels across web/custom deep links without auto starting',()=>{
 const u=new URL(routeLink(route));const j=readRouteLink(Object.fromEntries(u.searchParams));assert(j);assert.deepEqual(j.start,route.coordinates[0]);assert.deepEqual(j.end,route.coordinates[1]);assert.equal(j.startLabel,route.startLabel);
 assert.equal(readRouteLink({start:'NaN,3',end:'0,0'}),null);
 assert.equal(redirectSystemPath({path:`velunivo://share/route${u.search}`,initial:true}),`/share/route${u.search}`);
 assert.equal(redirectSystemPath({path:`https://velunivo.xcenter.it/share/trip?pin=${pin}`,initial:true}),`/share/trip?pin=${pin}`);
});
test('host caches late viewer state, throttles heartbeat, limits viewers and revokes session',()=>{
 const peer=new FakePeer(),statuses:string[]=[];const session=new PeerSession(peer as any,'host',pin,{status:s=>statuses.push(s)});peer.emit('open');
 session.publish({type:'route',route:sharedRoute(route)});session.publish({type:'progress',progress:sharedProgress(null,600,1000,100000)});
 const c=new Connection();peer.emit('connection',c);c.open=true;c.emit('open');assert.equal(c.sent.length,2);
 session.publish({type:'route',route:sharedRoute(route)});session.publish({type:'progress',progress:sharedProgress(null,599,990,101000)});assert.equal(c.sent.length,2);
 session.publish({type:'progress',progress:sharedProgress(null,595,950,105000)});assert.equal(c.sent.length,3);
 for(let i=0;i<7;i++)peer.emit('connection',new Connection());const extra=new Connection();peer.emit('connection',extra);assert(extra.closed);
 const call={close:()=>{call.closed=true;},closed:false};peer.emit('call',call);assert(call.closed);
 session.close();assert.equal(c.sent.at(-1).type,'ended');assert(c.closed);assert(peer.destroyed);
});
test('viewer handles ended / disconnections; remote telemetry is removed before listener',()=>{
 const peer=new FakePeer(),received:any[]=[];const session=new PeerSession(peer as any,'viewer',pin,{status:()=>{},message:m=>received.push(m)});peer.emit('open');const c=peer.connection;c.open=true;c.emit('open');
 c.emit('data',{type:'route',route:{...sharedRoute(route),battery:76}});assert.equal(received[0].route.battery,undefined);
 c.emit('data',{type:'ended'});assert(peer.destroyed);session.close();
});
test('native WebView host uses real PeerJS contract, caches messages and emits revoke on close',()=>{
 const html=nativePeerHtml('host',pin);const script=html.split('<script>').at(-1)!.split('</script>')[0];
 let peer:FakePeer|undefined;const emitted:any[]=[];const window:any={ReactNativeWebView:{postMessage:(s:string)=>emitted.push(JSON.parse(s))},addEventListener:()=>{}};
 const context=vm.createContext({window,Peer:class extends FakePeer{constructor(){super();peer=this;}},setTimeout,clearTimeout,setInterval,clearInterval,Date,Map,JSON});vm.runInContext(script,context);assert(peer);peer.emit('open');
 window.publish({type:'route',route:sharedRoute(route)});window.publish({type:'progress',progress:sharedProgress(null,600,1000,100000)});
 const c=new Connection();peer.emit('connection',c);c.open=true;c.emit('open');assert.equal(c.sent.length,2);vm.runInContext('stop()',context);assert(peer.destroyed);assert.equal(c.sent.at(-1).type,'ended');assert(emitted.some(e=>e.type==='ready'));
});

test('fork hostname configuration uses same-origin PeerServer and never PeerJS cloud',async()=>{
 const {resolveShareOrigin,peerServerOptions}=await import('../src/sharing/hostConfig');
 assert.equal(resolveShareOrigin(undefined,'https://fork.example'),'https://fork.example');
 assert.equal(resolveShareOrigin('https://official.example','https://fork.example'),'https://official.example');
 assert.deepEqual(peerServerOptions('https://fork.example'),{host:'fork.example',port:443,path:'/peer',secure:true,debug:0});
 assert.deepEqual(peerServerOptions('http://localhost:8790'),{host:'localhost',port:8790,path:'/peer',secure:false,debug:0});
 assert.equal(peerServerOptions('https://fork.example',{host:'signal.example',port:'8443'}).host,'signal.example');
 assert.throws(()=>resolveShareOrigin('http://public.example'));assert.throws(()=>resolveShareOrigin('https://public.example/path'));
 assert.throws(()=>peerServerOptions('https://fork.example',{port:'abc'}));
});
test('web app and PeerServer start together, deep paths work and peer discovery stays private',async()=>{
 const {mkdtemp,writeFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {spawn}=await import('node:child_process');
 const dir=await mkdtemp(join(tmpdir(),'velunivo-web-test-'));await writeFile(join(dir,'index.html'),'<html>Velunivo test shell</html>');await writeFile(join(dir,'worker.mjs'),'export {};');
 const child=spawn(process.execPath,['--import','tsx','server/start-web.ts'],{env:{...process.env,WEB_DIR:dir,PORT:'0'},stdio:['ignore','pipe','pipe']});
 const origin=await new Promise<string>((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('Web server startup timed out')),10000);child.stdout.on('data',chunk=>{const m=String(chunk).match(/listening on (\d+)/);if(m){clearTimeout(t);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('error',reject);child.on('exit',code=>{clearTimeout(t);if(code)reject(new Error('Web server startup failed'));});});
 try{assert.deepEqual(await(await fetch(origin+'/health')).json(),{web:true,peer:true});assert.match(await(await fetch(origin+'/share/trip?pin='+pin)).text(),/test shell/);assert.equal((await fetch(origin+'/peer/peerjs/peers')).status,401);assert.equal((await fetch(origin+'/worker.mjs')).headers.get('content-type'),'application/javascript');assert.equal((await fetch(origin+'/share/trip')).headers.get('referrer-policy'),'no-referrer');assert.equal((await fetch(origin+'/missing.js')).status,404);}finally{const exited=new Promise<void>(r=>child.on('exit',()=>r()));child.kill('SIGTERM');await exited;await rm(dir,{recursive:true,force:true});}
});

import {createViewerPresence} from '../src/sharing/viewerPresence';
test('viewer presence expires only sixty seconds after its last sent update and deduplicates reconnects',()=>{let now=0;const presence=createViewerPresence(()=>now);presence.mark('viewer');assert.equal(presence.count(),1);now=59999;assert.equal(presence.count(),1);presence.mark('viewer');assert.equal(presence.count(),1);now+=60000;assert.equal(presence.count(),0);});
test('host viewer count survives a closed channel until the one-minute grace period expires',t=>{t.mock.timers.enable({apis:['Date','setInterval','setTimeout'],now:100000});const peer=new FakePeer(),counts:number[]=[];const session=new PeerSession(peer as any,'host',pin,{status:()=>{},viewers:n=>counts.push(n)});peer.emit('open');session.publish({type:'progress',progress:sharedProgress(null,300,1000,100000)});const c=new Connection();peer.emit('connection',c);c.open=true;c.emit('open');assert.equal(counts.at(-1),1);c.close();t.mock.timers.tick(59000);assert.equal(counts.at(-1),1);t.mock.timers.tick(1000);assert.equal(counts.at(-1),0);session.close();});
test('native host startup remains valid when Hermes returns bytecode for function.toString',()=>{
 const original=createViewerPresence.toString;createViewerPresence.toString=()=> 'function createViewerPresence() { [bytecode] }';
 try{const messages:any[]=[];let peer:FakePeer|undefined;const html=nativePeerHtml('host',pin);const script=html.split('<script>').at(-1)!.split('</script>')[0];vm.runInNewContext(script,{Peer:class extends FakePeer{constructor(){super();peer=this;}},window:{ReactNativeWebView:{postMessage:(s:string)=>messages.push(JSON.parse(s))},addEventListener:()=>{}},setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},Date,Map,JSON});assert(peer);peer!.emit('open');assert(messages.some(m=>m.type==='ready'));assert(messages.some(m=>m.type==='status'&&m.value==='Live trip sharing is on'));}
 finally{createViewerPresence.toString=original;}
});
test('closing a failed host preserves its actionable timeout instead of overwriting it with disconnection',t=>{t.mock.timers.enable({apis:['setTimeout']});class DisconnectingPeer extends FakePeer{destroy(){super.destroy();this.emit('disconnected');}}const statuses:string[]=[];const session=new PeerSession(new DisconnectingPeer() as any,'host',pin,{status:s=>statuses.push(s)});t.mock.timers.tick(20000);assert.equal(statuses.at(-1),'Connection timed out. Retry when both devices are online.');session.close();});
import {clientPeerId,clientPeerIdScript} from '../src/sharing/peerIdentity';
test('native and web clients allocate matching unique IDs without calling the server ID endpoint',()=>{const bytes=new Uint8Array(16).fill(10);const expected=clientPeerId('viewer',bytes);const actual=vm.runInNewContext(clientPeerIdScript+";clientPeerId('viewer')",{crypto:{getRandomValues:(out:Uint8Array)=>{out.set(bytes);return out;}}});assert.equal(actual,expected);assert.equal(expected.length,48);assert.notEqual(clientPeerId('sync',bytes),expected);});

test('web host replaces repeated viewer connections with stable metadata without inflating count',t=>{
 t.mock.timers.enable({apis:['Date','setInterval','setTimeout'],now:100000});
 const peer=new FakePeer(),counts:number[]=[];const session=new PeerSession(peer as any,'host',pin,{status:()=>{},viewers:n=>counts.push(n)});peer.emit('open');session.publish({type:'progress',progress:sharedProgress(null,300,1000,100000)});
 const connect=(viewerId:string,peerId:string)=>{const c=Object.assign(new Connection(),{metadata:{viewerId},peer:peerId});peer.emit('connection',c);c.open=true;c.emit('open');return c;};
 const id=clientPeerId('viewer',new Uint8Array(16).fill(1));let previous=connect(id,'first');
 for(let i=0;i<12;i++){const next=connect(id,'retry-'+i);assert(previous.closed);assert.equal(counts.at(-1),1);previous=next;}
 connect(clientPeerId('viewer',new Uint8Array(16).fill(2)),'another');assert.equal(counts.at(-1),2);
 previous.close();t.mock.timers.tick(59000);assert.equal(counts.at(-1),2);t.mock.timers.tick(1000);assert.equal(counts.at(-1),0);session.close();
});
test('native host deduplicates viewer retry identities and still distinguishes other viewers',()=>{
 const emitted:any[]=[];let peer:FakePeer|undefined;
 const script=nativePeerHtml('host',pin).split('<script>').at(-1)!.split('</script>')[0];
 const context=vm.createContext({window:{ReactNativeWebView:{postMessage:(s:string)=>emitted.push(JSON.parse(s))},addEventListener:()=>{}},Peer:class extends FakePeer{constructor(){super();peer=this;}},setTimeout,clearTimeout,setInterval,clearInterval,Date,Map,JSON});vm.runInContext(script,context);peer!.emit('open');vm.runInContext(`window.publish(${JSON.stringify({type:'progress',progress:sharedProgress(null,300,1000,100000)})})`,context);
 const id=clientPeerId('viewer',new Uint8Array(16).fill(3));let previous:Connection|undefined;
 for(let i=0;i<12;i++){const c=Object.assign(new Connection(),{metadata:{viewerId:id},peer:'retry-'+i});peer!.emit('connection',c);c.open=true;c.emit('open');if(previous)assert(previous.closed);previous=c;assert.equal(emitted.filter(e=>e.type==='viewers').at(-1).value,1);}
 const other=Object.assign(new Connection(),{metadata:{viewerId:clientPeerId('viewer',new Uint8Array(16).fill(4))},peer:'another'});peer!.emit('connection',other);other.open=true;other.emit('open');assert.equal(emitted.filter(e=>e.type==='viewers').at(-1).value,2);vm.runInContext('stop()',context);
});
