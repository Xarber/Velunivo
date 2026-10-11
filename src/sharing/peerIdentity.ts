/** Clients allocate their own IDs: avoids an unnecessary cross-origin PeerServer /id fetch in WebViews. */
export function clientPeerId(kind:'viewer'|'sync',bytes:Uint8Array){
 if(bytes.length!==16)throw new Error('Secure randomness unavailable.');
 return `velunivo-${kind}-${Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}`;
}
/** Literal source survives Hermes; never serialize a live function into a WebView. */
export const clientPeerIdScript=`function clientPeerId(kind){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return 'velunivo-'+kind+'-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}`;
