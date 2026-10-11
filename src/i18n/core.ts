import {italian} from './it';
export type Language='en'|'it';
export type LanguageChoice=Language|'system';
let choice:LanguageChoice='system';
const listeners=new Set<()=>void>();
export function resolveLanguage(value:LanguageChoice,system:string):Language{return value==='system'?(system.toLowerCase().startsWith('it')?'it':'en'):value;}
export function systemLanguage(){return typeof navigator!=='undefined'?navigator.language:Intl.DateTimeFormat().resolvedOptions().locale;}
export function getLanguageChoice(){return choice;}
export function getLanguage(){return resolveLanguage(choice,systemLanguage());}
export function languageTag(){return getLanguage()==='it'?'it-IT':'en-US';}
export function setLanguageChoice(value:LanguageChoice){choice=value;for(const fn of listeners)fn();}
export function notifySystemLanguage(){for(const fn of listeners)fn();}
export function subscribeLanguage(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
/** Exact UI messages and separated dashboard fragments. Unknown/user text passes through. */
export function translate(text:string,language:Language=getLanguage()):string{
 if(language==='en')return text;
 const key=text.trim(),value=italian[key];if(value)return text.replace(key,value);
 for(const [source,target] of templates){const match=source.regex.exec(key);if(match){let result=target;source.names.forEach((name,i)=>{result=result.replaceAll('{'+name+'}',translate(match[i+1],language));});return text.replace(key,result);}}

 if(text.includes(' · '))return text.split(' · ').map(part=>translate(part,language)).join(' · ');
 return text;
}
export const t=translate;

const templates=Object.entries(italian).filter(([key])=>key.includes('{')).map(([key,value])=>{const names:string[]=[];const pattern=key.split(/(\{[^}]+\})/).map(part=>{if(part.startsWith('{')&&part.endsWith('}')){names.push(part.slice(1,-1));return '(.+?)';}return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('');return [{regex:new RegExp('^'+pattern+'$'),names},value] as const;});
