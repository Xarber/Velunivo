export const profileBadges=[{id:'none',name:'No badge',xp:0,icon:'person-outline'},{id:'leaf',name:'Green rider',xp:20,icon:'leaf-outline'},{id:'spark',name:'Curious explorer',xp:100,icon:'sparkles-outline'},{id:'crown',name:'City adventurer',xp:500,icon:'trophy-outline'}] as const;
export const navigationArrows=[{id:'classic',name:'Classic arrow',xp:0},{id:'chevron',name:'Trail arrow',xp:40},{id:'compass',name:'Explorer arrow',xp:200}] as const;
export type ProfileBadge=typeof profileBadges[number]['id'];
export type NavigationArrow=typeof navigationArrows[number]['id'];
export function arrowPath(style:NavigationArrow){return style==='chevron'?'M20 3L35 35L20 27L5 35Z':style==='compass'?'M20 2L31 37L20 29L9 37Z':'M20 2L35 37L20 29L5 37Z';}
