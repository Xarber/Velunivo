import {cellToChildren,cellToLatLng,gridDisk,latLngToCell} from 'h3-js';
import {Coord} from './types';
import {ScratchIndex} from './scratchMap';
import {distance} from './geo';
export interface AreaChallenge {day:string;coordinate:Coord;name:string;createdAt:number;}
export function localDay(now:number){const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function dailyQuest(now:number){const day=localDay(now),seed=[...day].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7);return {id:'daily:'+day,day,goal:4+seed%7,xp:75+(seed%7)*10};}
/** A modest nearby area, not a route or permission to enter land. Completion needs actual ride GPS. */
export function areaChallenge(origin:Coord,index:ScratchIndex,now:number):AreaChallenge|null{
 const seed=[...localDay(now)].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,7),cells=gridDisk(latLngToCell(origin[1],origin[0],8),3);
 const candidates=cells.map(c=>{const [lat,lon]=cellToLatLng(c);return [lon,lat] as Coord;}).filter(c=>distance(origin,c)>=800&&distance(origin,c)<=4000);
 const unseen=candidates.filter(c=>!cellToChildren(latLngToCell(c[1],c[0],8),10).some(id=>!!index.tiles[id]));if(!unseen.length)return null;
 return {day:localDay(now),coordinate:unseen[seed%unseen.length],name:'',createdAt:now};
}
export function completedChallenges(index:ScratchIndex,area:AreaChallenge|null,now:number){const quest=dailyQuest(now),dayStart=new Date(now);dayStart.setHours(0,0,0,0);const today=Object.entries(index.tiles).filter(([,v])=>!v.approximate&&v.firstVisited>=dayStart.getTime()&&v.firstVisited<=now),earned:Record<string,{xp:number;completedAt:number}>={};
 if(today.length>=quest.goal)earned[quest.id]={xp:quest.xp,completedAt:now};
 if(area?.day===quest.day&&today.some(([cell,v])=>{const [lat,lon]=cellToLatLng(cell);return v.firstVisited>=area.createdAt&&distance([lon,lat],area.coordinate)<=350;}))earned['area:'+quest.day]={xp:250,completedAt:now};
 return {quest,count:today.length,earned};
}
export const cosmeticThemes=[{id:'default',name:'Velunivo',xp:0,light:'#007F6D',dark:'#64DCC5'},{id:'sky',name:'Sky',xp:250,light:'#0066AE',dark:'#78C9FF'},{id:'sunset',name:'Sunset',xp:750,light:'#A63D27',dark:'#FFAA87'},{id:'forest',name:'Forest',xp:1500,light:'#41751B',dark:'#A7DE7B'},{id:'dusk',name:'Dusk',xp:2500,light:'#7640AC',dark:'#CFACFF'}] as const;
export type CosmeticTheme=typeof cosmeticThemes[number]['id'];
