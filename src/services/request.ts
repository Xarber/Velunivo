import {diagnostic} from '../core/diagnosticEvents';
/** React Native's AbortSignal has no static timeout method. Keep cancellation portable. */
export async function requestJson(url: string, options: RequestInit = {}, timeoutMs = 25000) {
  const started=Date.now();let endpoint='unknown';try{const u=new URL(url);endpoint=u.hostname+u.pathname;}catch{}diagnostic('network','request',{endpoint});
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const body = await response.json();
    diagnostic('network','response',{endpoint,status:response.status,elapsedMs:Date.now()-started});return { response, body };
  } catch(error){diagnostic('network','error',{endpoint,elapsedMs:Date.now()-started,message:error instanceof Error?error.message:'Request failed'});throw error;}finally { clearTimeout(timer); }
}
