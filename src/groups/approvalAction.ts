/** Exact room/request binding prevents old Lock Screen buttons approving another rider. */
export function readApprovalAction(value:string){const m=/^group-approval:([A-Z0-9]{8}):([a-f0-9]{32}):([01])$/.exec(value);return m?{code:m[1],id:m[2],allow:m[3]==='1'}:null;}
