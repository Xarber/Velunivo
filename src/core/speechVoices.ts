export interface SpeechVoice {identifier:string;name:string;language:string;quality:string}
export function matchingVoices(voices:SpeechVoice[],language:string){const prefix=language.split('-')[0].toLowerCase();return voices.filter(v=>v.language.toLowerCase().split(/[-_]/)[0]===prefix).sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name));}
function score(v:SpeechVoice){return v.quality.toLowerCase()==='premium'?3:v.quality.toLowerCase()==='enhanced'?2:1;}
export function preferredVoice(voices:SpeechVoice[],language:string,identifier?:string){const matching=matchingVoices(voices,language);return matching.find(v=>v.identifier===identifier) || matching.find(v=>score(v)>1);}
