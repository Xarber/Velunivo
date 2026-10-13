let reconnects=0;const recovering=new Map<string,boolean>();
export function notePeerStatus(status:string,source='group'){if(/interrupted|reconnecting|disconnected|connection lost|connection unavailable/i.test(status)){if(!recovering.get(source))reconnects++;recovering.set(source,true);}else if(/^(connected|group connected|live trip sharing is on|sharing live)/i.test(status))recovering.set(source,false);}
export const peerReconnectCount=()=>reconnects;
