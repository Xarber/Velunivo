/** Preserve the last marker, but never present a stale GPS position as live. */
export function markerOpacity(locationAt:number|undefined,presenceAt:number|undefined,now=Date.now()){const age=Math.max(locationAt===undefined?0:now-locationAt,presenceAt===undefined?0:now-presenceAt);return !Number.isFinite(age)||age>60000?.45:age>20000?.7:1;}
