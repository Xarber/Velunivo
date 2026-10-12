export interface DownloadProgress { phase: 'downloading' | 'saving'; fraction?: number; }
export function downloadFraction(received: number, total?: number) { return total && total > 0 && Number.isFinite(total) ? Math.max(0, Math.min(1, received / total)) : undefined; }
/** Some native fetch implementations expose no stream. Never invent a percentage. */
export async function readDownload(response: Response, onProgress?: (progress: DownloadProgress) => void, maxBytes = 20_000_000): Promise<string> {
  const encoding=response.headers.get('Content-Encoding');
  const total = !encoding || encoding==='identity' ? Number(response.headers.get('Content-Length')) || undefined : undefined;
  if (total && total > maxBytes) throw new Error('This road network is too large. Choose a smaller region.');
  onProgress?.({phase:'downloading',fraction:downloadFraction(0,total)});
  if (!response.body?.getReader || typeof TextDecoder === 'undefined') {
    const text = await response.text();
    if (text.length > maxBytes) throw new Error('This road network is too large. Choose a smaller region.');
    return text;
  }
  const reader = response.body.getReader(), chunks: Uint8Array[] = []; let bytes = 0;
  try { while (true) { const result = await reader.read(); if (result.done) break; bytes += result.value.byteLength; if (bytes > maxBytes) throw new Error('This road network is too large. Choose a smaller region.'); chunks.push(result.value); onProgress?.({phase:'downloading',fraction:downloadFraction(bytes,total)}); } }
  catch (error) { await reader.cancel().catch(()=>{}); throw error; }
  finally { reader.releaseLock(); }
  const decoder = new TextDecoder(); return chunks.map(chunk => decoder.decode(chunk,{stream:true})).join('') + decoder.decode();
}
