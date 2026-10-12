let requestedAt=0;
/** An in-app consent action, never a public deep-link parameter. */
export function requestRecordingStart(){requestedAt=Date.now();}
export function consumeRecordingStart(){const requested=requestedAt>0&&Date.now()-requestedAt<10000;requestedAt=0;return requested;}
