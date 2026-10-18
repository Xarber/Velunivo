import test from 'node:test';
import assert from 'node:assert/strict';
import {appendMemoryMedia,memoryMediaURL} from '../src/services/memoryMedia.web';

test('web media chunks use portable binary buffers and legacy Blob chunks remain readable',async()=>{
 const originalDB=Object.getOwnPropertyDescriptor(globalThis,'indexedDB'),originalRange=Object.getOwnPropertyDescriptor(globalThis,'IDBKeyRange');
 const chunks:{id:string;index:number;bytes:ArrayBuffer|Blob}[]=[];
 const db={transaction:()=>{const tx:any={objectStore:()=>({
  count:()=>{const request:any={};queueMicrotask(()=>{request.result=chunks.length;request.onsuccess();});return request;},
  put:(value:typeof chunks[number])=>{chunks.push(value);queueMicrotask(()=>tx.oncomplete?.());},
  getAll:()=>{const request:any={};queueMicrotask(()=>{request.result=chunks;request.onsuccess();});return request;},
 })};return tx;}};
 Object.defineProperty(globalThis,'indexedDB',{configurable:true,value:{open:()=>{const request:any={};queueMicrotask(()=>{request.result=db;request.onsuccess();});return request;}}});
 Object.defineProperty(globalThis,'IDBKeyRange',{configurable:true,value:{bound:()=>({})}});
 let url='';try{
  const source=new Uint8Array([1,2,3]);await appendMemoryMedia('qa',source);source[0]=99;
  assert(chunks[0].bytes instanceof ArrayBuffer);assert.deepEqual([...new Uint8Array(chunks[0].bytes)],[1,2,3]);
  chunks.push({id:'qa',index:1,bytes:new Blob([new Uint8Array([4,5])])});
  url=await memoryMediaURL('qa','video/mp4');const response=await fetch(url);
  assert.equal(response.headers.get('content-type'),'video/mp4');assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3,4,5]);
 }finally{
  if(url)URL.revokeObjectURL(url);
  if(originalDB)Object.defineProperty(globalThis,'indexedDB',originalDB);else Reflect.deleteProperty(globalThis,'indexedDB');
  if(originalRange)Object.defineProperty(globalThis,'IDBKeyRange',originalRange);else Reflect.deleteProperty(globalThis,'IDBKeyRange');
 }
});
