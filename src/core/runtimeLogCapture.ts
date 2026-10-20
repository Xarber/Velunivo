import {DiagnosticEvent,redactDiagnostic} from './diagnosticEvents';
interface ErrorUtilities {getGlobalHandler():((error:Error,fatal?:boolean)=>void);setGlobalHandler(handler:(error:Error,fatal?:boolean)=>void):void;}
interface Runtime {console:Pick<Console,'log'|'info'|'debug'|'warn'|'error'>;ErrorUtils?:ErrorUtilities;addEventListener?(name:string,listener:(event:any)=>void):void;removeEventListener?(name:string,listener:(event:any)=>void):void;HermesInternal?:{enablePromiseRejectionTracker?(options:{allRejections:boolean;onUnhandled(id:number,error:unknown):void;onHandled(id:number):void}):void};}
const levels=['error','warn','log','info','debug'] as const;
/** Bound hostile/circular console arguments without invoking getters or toJSON. */
export function runtimeArgument(value:unknown,depth=0,seen=new Set<object>()):unknown {
 if(value===null||typeof value==='boolean'||typeof value==='number')return value;
 if(typeof value==='string')return value.slice(0,10000);
 if(value===undefined)return '[undefined]';
 if(typeof value!=='object')return String(value).slice(0,200);
 if(seen.has(value))return '[circular]';if(depth>=4)return '[depth limit]';seen.add(value);
 try{if(value instanceof Error)return {name:value.name,message:value.message,stack:value.stack?.slice(0,14000),...(value.cause?{cause:runtimeArgument(value.cause,depth+1,seen)}:{})};
 if(Array.isArray(value))return value.slice(0,20).map(v=>runtimeArgument(v,depth+1,seen));
 return Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(value)).slice(0,25).map(([key,property])=>[key,'value' in property?runtimeArgument(property.value,depth+1,seen):'[accessor]']));
 }catch{return '[unreadable]';}finally{seen.delete(value);}
}
/** Preserve the platform's logging/crash UI; our side channel must never throw. */
export function installRuntimeLogCapture(target:Runtime,sink:(event:DiagnosticEvent)=>void,{now=Date.now,nativePromiseTracking=false}:{now?:()=>number;nativePromiseTracking?:boolean}={}) {
 let gate:boolean|undefined,verbose=false,inside=false,windowAt=now(),dropped=0,trackerInstalled=false;
 const early:DiagnosticEvent[]=[],counts=new Map<string,number>(),restores:(()=>void)[]=[];
 const output=(event:DiagnosticEvent)=>{try{sink(event);}catch{/* No recursion into console. */}};
 function capture(area:string,event:string,details:Record<string,unknown>){if(inside||gate===false)return;inside=true;try{const at=now();if(at-windowAt>=60000){if(gate&&dropped)output({at,area:'runtime',event:'rate-limit',details:{dropped}});counts.clear();dropped=0;windowAt=at;}const category=event==='error'?'error':event==='warn'?'warn':'other',count=(counts.get(category)??0)+1;counts.set(category,count);if(count>(category==='error'?120:category==='warn'?180:240)){dropped++;return;}const record={at,area,event,details:redactDiagnostic(details) as Record<string,unknown>};if(gate)output(record);else if(event==='error'||event==='warn'){early.push(record);if(early.length>40)early.shift();}}finally{inside=false;}}
 for(const level of levels){const previous=target.console[level];const wrapped=function(this:unknown,...args:unknown[]){if(gate!==false&&(level==='error'||level==='warn'||verbose))capture('console',level,{arguments:args.slice(0,12).map(value=>runtimeArgument(value))});return Reflect.apply(previous,this,args);};target.console[level]=wrapped;restores.push(()=>{if(target.console[level]===wrapped)target.console[level]=previous;});}
 if(target.ErrorUtils){const utils=target.ErrorUtils,previous=utils.getGlobalHandler();const handler=(error:Error,fatal?:boolean)=>{capture('javascript','error',{fatal:!!fatal,error:runtimeArgument(error)});previous(error,fatal);};utils.setGlobalHandler(handler);restores.push(()=>{if(utils.getGlobalHandler()===handler)utils.setGlobalHandler(previous);});}
 const error=(event:any)=>capture('javascript','error',{error:runtimeArgument(event.error??event.message??'JavaScript error')}),rejection=(event:any)=>capture('promise','error',{reason:runtimeArgument(event.reason)});
 target.addEventListener?.('error',error);target.addEventListener?.('unhandledrejection',rejection);
 restores.push(()=>{target.removeEventListener?.('error',error);target.removeEventListener?.('unhandledrejection',rejection);});
 return {configure(enabled:boolean,detailed=false){gate=enabled;verbose=enabled&&detailed;if(enabled){for(const event of early)output(event);if(nativePromiseTracking&&!trackerInstalled&&target.HermesInternal?.enablePromiseRejectionTracker){try{target.HermesInternal.enablePromiseRejectionTracker({allRejections:true,onUnhandled:(id,error)=>capture('promise','error',{id,reason:runtimeArgument(error)}),onHandled:id=>capture('promise','handled',{id})});trackerInstalled=true;}catch{/* Console/global hooks still work when the engine lacks tracking. */}}}early.length=0;},dispose(){gate=false;early.length=0;for(const restore of restores.reverse())restore();}};
}
