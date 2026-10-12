/** Identical data must have the same digest regardless of object insertion order. */
export function canonicalJson(value:unknown):string {return JSON.stringify(value,(_key,current)=>current&&typeof current==='object'&&!Array.isArray(current)?Object.fromEntries(Object.entries(current).sort(([a],[b])=>a<b?-1:a>b?1:0)):current);}
