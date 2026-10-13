let count:number|undefined;
export const getGroupActivityCount=()=>count;
export function setGroupActivityCount(value:number|undefined){count=value===undefined?undefined:Math.max(1,Math.min(8,Math.floor(value)));}
