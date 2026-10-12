/** WKWebView may report the inline document base URL with or without its trailing slash. */
export function allowNativePeerDocument(candidate:string,origin:string){if(candidate==='about:blank')return true;try{const url=new URL(candidate),base=new URL(origin);return url.origin===base.origin&&url.pathname==='/'&&!url.search&&!url.hash&&!url.username&&!url.password;}catch{return false;}}
