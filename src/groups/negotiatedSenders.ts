/** Native Unified Plan can create new transceivers while accepting an offer.
 * Bind capture to the sender actually associated with an offered m-line, rather
 * than a pre-created, still-unassociated sender. Muting keeps sendrecv negotiated. */
export function negotiatedTransceiver<T extends {mid:string|null;receiver:{track:{kind:string}|null};direction:string}>(transceivers:T[],kind:'audio'|'video',sdp?:string):T|undefined{
 const section=sdp?.split(/(?=^m=)/m).find(part=>part.startsWith(`m=${kind} `)&&!part.startsWith(`m=${kind} 0 `));
 if(sdp&&!section)return undefined;
 const mid=section?.match(/^a=mid:(.+)$/m)?.[1]?.trim();
 return (mid?transceivers.find(t=>t.mid===mid):undefined)??transceivers.find(t=>t.mid!==null&&t.receiver.track?.kind===kind);
}
