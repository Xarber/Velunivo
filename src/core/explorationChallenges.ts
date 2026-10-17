import {cellToChildren,cellToLatLng,gridDisk,latLngToCell} from 'h3-js';
import {Coord} from './types';
import {ScratchIndex} from './scratchMap';
import {distance} from './geo';
export interface AreaChallenge {day:string;coordinate:Coord;name:string;createdAt:number;distanceMeters?:number;}
export function localDay(now:number){const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function dailyQuest(now:number){const day=localDay(now),seed=[...day].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7);return {id:'daily:'+day,day,goal:10+seed%6,xp:(10+seed%6)*10};}
export const NEIGHBOURHOOD_MAX_METERS=10000;
/** A nearby area, not a route or permission to enter land. Completion needs actual ride GPS. */
export function areaChallenge(origin:Coord,index:ScratchIndex,now:number):AreaChallenge|null{
 const seed=[...localDay(now)].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7),cells=gridDisk(latLngToCell(origin[1],origin[0],8),16);
 const candidates=cells.map(c=>{const [lat,lon]=cellToLatLng(c);return [lon,lat] as Coord;}).filter(c=>distance(origin,c)>=800&&distance(origin,c)<=NEIGHBOURHOOD_MAX_METERS);
 // Check the seeded candidate first; avoid expanding every cell into children on low-end devices.
 for(let offset=0;offset<candidates.length;offset++){const coordinate=candidates[(seed+offset)%candidates.length];if(!cellToChildren(latLngToCell(coordinate[1],coordinate[0],8),10).some(id=>!!index.tiles[id]))return {day:localDay(now),coordinate,name:'',createdAt:now,distanceMeters:distance(origin,coordinate)};}
 return null;
}
export function completedChallenges(index:ScratchIndex,area:AreaChallenge|null,now:number){const quest=dailyQuest(now),dayStart=new Date(now);dayStart.setHours(0,0,0,0);const today=Object.entries(index.tiles).filter(([,v])=>!v.approximate&&v.firstVisited>=dayStart.getTime()&&v.firstVisited<=now),earned:Record<string,{xp:number;completedAt:number}>={};
 if(today.length>=quest.goal)earned[quest.id]={xp:quest.xp,completedAt:now};
 if(area?.day===quest.day&&today.some(([cell,v])=>{const [lat,lon]=cellToLatLng(cell);return v.firstVisited>=area.createdAt&&distance([lon,lat],area.coordinate)<=350;}))earned['area:'+quest.day]={xp:neighbourhoodXP(area.distanceMeters),completedAt:now};
 return {quest,count:today.length,earned};
}
export const cosmeticThemes=[{id:'default',name:'Velunivo',xp:0,light:'#007F6D',dark:'#64DCC5'},{id:'sky',name:'Sky',xp:3000,light:'#0066AE',dark:'#78C9FF'},{id:'sunset',name:'Sunset',xp:7000,light:'#A63D27',dark:'#FFAA87'},{id:'forest',name:'Forest',xp:15000,light:'#41751B',dark:'#A7DE7B'},{id:'dusk',name:'Dusk',xp:25000,light:'#7640AC',dark:'#CFACFF'}] as const;
export type CosmeticTheme=typeof cosmeticThemes[number]['id'];

/** Distance-scaled reward: 10 km earns 500 XP; old challenges lacking distance retain their promised 250 XP. */
export function neighbourhoodXP(meters?:number){if(meters===undefined)return 250;return Math.round((100+400*Math.min(10000,Math.max(0,Number.isFinite(meters)?meters:0))/10000)/5)*5;}
