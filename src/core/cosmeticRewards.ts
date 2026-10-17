export const profileBadges=[{id:'completion',name:'All achievements',xp:0,icon:'trophy-outline'},{id:'level50',name:'Level 50',xp:240100,icon:'star'},{id:'none',name:'No badge',xp:0,icon:'person-outline'},{id:'leaf',name:'Green rider',xp:1000,icon:'leaf-outline'},{id:'spark',name:'Curious explorer',xp:4000,icon:'sparkles-outline'},{id:'crown',name:'City adventurer',xp:12000,icon:'trophy-outline'}] as const;
export const navigationArrows=[{id:'classic',name:'Classic arrow',xp:0},{id:'chevron',name:'Trail arrow',xp:2000},{id:'compass',name:'Explorer arrow',xp:6000}] as const;
export type ProfileBadge=typeof profileBadges[number]['id'];
export type NavigationArrow=typeof navigationArrows[number]['id'];
export function arrowPath(style:NavigationArrow){return style==='chevron'?'M20 2L36 18L36 34L20 18L4 34L4 18Z':style==='compass'?'M20 2L33 20L20 38L7 20Z M20 9L20 30L26 20Z':'M20 2L35 37L20 29L5 37Z';}

export const locationPins=[{id:"classic",name:"Classic pin",xp:0},{id:"halo",name:"Halo pin",xp:1500},{id:"diamond",name:"Diamond pin",xp:5000}] as const;
export const scratchStyles=[{id:"soft",name:"Soft edges",xp:0},{id:"crisp",name:"Crisp edges",xp:4500}] as const;
