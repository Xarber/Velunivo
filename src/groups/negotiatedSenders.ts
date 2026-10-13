/** Native Unified Plan can create new transceivers while accepting an offer.
 * Bind capture to the sender actually associated with an offered m-line, rather
 * than a pre-created, still-unassociated sender. Muting keeps sendrecv negotiated. */
export function negotiatedTransceiver<T extends {mid:string|null;receiver:{track:{kind:string}|null};direction:string}>(transceivers:T[],kind:'audio'|'video'):T|undefined{
 return transceivers.find(t=>t.mid!==null&&t.receiver.track?.kind===kind);
}
