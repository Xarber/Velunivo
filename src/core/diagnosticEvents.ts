export interface DiagnosticEvent {at:number;area:string;event:string;details?:Record<string,unknown>;}
let verbose=false;
export const verboseDiagnosticsEnabled=()=>verbose;
export const setVerboseDiagnostics=(enabled:boolean)=>{verbose=enabled;};
export function verboseDiagnostic(area:string,event:string,details?:Record<string,unknown>){if(verbose)diagnostic(area,event,details);}
let sink:((event:DiagnosticEvent)=>void)|undefined;
export function setDiagnosticSink(value:((event:DiagnosticEvent)=>void)|undefined){sink=value;}
export function diagnostic(area:string,event:string,details?:Record<string,unknown>){try{sink?.({at:Date.now(),area,event,details});}catch{/* Diagnostics must never stop a ride. */}}
export function redactDiagnostic(value:unknown,key=''):unknown{if(/token|secret|password|credential|key|coordinate|latitude|longitude|serial|deviceid|address|photo|sdp|pin|code/i.test(key))return '[redacted]';if(typeof value==='string')return value.slice(0,/stack|trace/i.test(key)?10000:1500).replace(/(?:https?|wss?|velunivo|exp\+velunivo):\/\/[^\s)]+/g,'[url]').replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9+/._=-]+/gi,'[authorization]').replace(/([\"']?(?:token|secret|password|api[_-]?key|authorization|credential)[\"']?\s*[:=]\s*)(?:\"[^\"]*\"|'[^']*'|[^\s,;}]+)/gi,'$1[redacted]').replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g,'[network address]').replace(/[a-f0-9]{24,}/gi,'[redacted]').replace(/\b-?\d{1,3}\.\d{4,}\b/g,'[coordinate]').replace(/\/(Users|home)\/[^/]+/g,'/$1/[user]');if(Array.isArray(value))return value.slice(0,30).map(v=>redactDiagnostic(v));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).slice(0,30).map(([k,v])=>[k,redactDiagnostic(v,k)]));return value;}
