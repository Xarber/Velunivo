/** iOS Copy reads both message and url, so supply the link through one field only. */
export function nativeSharePayload(platform:string,url:string,title:string){return platform==='ios'?{title,url}:{title,message:url};}
