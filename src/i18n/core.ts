import {italian} from './it';
import spanish from './es.json';import french from './fr.json';import german from './de.json';import portuguese from './pt.json';
export const languages=['en','it','es','fr','de','pt'] as const;
export const languageNames={en:'English',it:'Italiano',es:'Español',fr:'Français',de:'Deutsch',pt:'Português'};
const dictionaries:Record<string,Record<string,string>>={it:italian,es:spanish,fr:french,de:german,pt:portuguese};
export const localeTags={en:'en-US',it:'it-IT',es:'es-ES',fr:'fr-FR',de:'de-DE',pt:'pt-BR'};
export type Language=typeof languages[number];
export type LanguageChoice=Language|'system';
let choice:LanguageChoice='system';
const listeners=new Set<()=>void>();
export function resolveLanguage(value:LanguageChoice,system?:string|null):Language{const requested=value==='system'?(typeof system==='string'?system.trim().toLowerCase().split(/[-_]/)[0]:'en'):value;return languages.includes(requested as Language)?requested as Language:'en';}
let deviceLocaleReader:(()=>string|undefined)|undefined;
/** The React entry installs the native locale source; pure core/server callers need no native module. */
export function setDeviceLocaleReader(reader:typeof deviceLocaleReader){deviceLocaleReader=reader;}
export function systemLanguage():string{
 try{const locale=deviceLocaleReader?.();if(typeof locale==='string' && locale.trim())return locale;}catch{/* Continue through safe fallbacks when the native module is unavailable. */}
 try{const locale=typeof navigator!=='undefined'?navigator.language:undefined;if(typeof locale==='string' && locale.trim())return locale;}catch{/* Some native runtimes expose an incomplete navigator shim. */}
 try{const locale=Intl.DateTimeFormat().resolvedOptions().locale;if(typeof locale==='string' && locale.trim())return locale;}catch{/* Locale/Intl can be unavailable during startup. */}
 return 'en';
}
export function getLanguageChoice(){return choice;}
export function getLanguage(){return resolveLanguage(choice,systemLanguage());}
export function languageTag(){return localeTags[getLanguage()];}
export function setLanguageChoice(value:LanguageChoice){choice=value;for(const fn of listeners)fn();}
export function notifySystemLanguage(){for(const fn of listeners)fn();}
export function subscribeLanguage(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
/** Exact UI messages and separated dashboard fragments. Unknown/user text passes through. */
export function translate(text:string,language:Language=getLanguage()):string{
 if(language==='en')return text;
 const key=text.trim(),value=dictionaries[language]?.[key];if(value)return text.replace(key,value);
 for(const [source,target] of templates[language]||[]){const match=source.regex.exec(key);if(match&&!match.slice(1).some(value=>/ · |\.\s+[A-Za-z]/.test(value))){let result=target;source.names.forEach((name,i)=>{result=result.replaceAll('{'+name+'}',translate(match[i+1],language));});return text.replace(key,result);}}

 if(/\.\s+[A-Za-z]/.test(text))return text.split(/(?<=\.)(\s+)/).map(part=>part.trim()?translate(part,language):part).join('');
 if(text.includes(' · '))return text.split(' · ').map(part=>translate(part,language)).join(' · ');
 return text;
}
export const t=translate;

const templates=Object.fromEntries(Object.entries(dictionaries).map(([lang,dictionary])=>[lang,Object.entries(dictionary).filter(([key])=>key.includes('{')).map(([key,value])=>{const names:string[]=[];const pattern=key.split(/(\{[^}]+\})/).map(part=>{if(part.startsWith('{')&&part.endsWith('}')){names.push(part.slice(1,-1));return '(.+?)';}return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('');return [{regex:new RegExp('^'+pattern+'$'),names},value] as const;})]));
