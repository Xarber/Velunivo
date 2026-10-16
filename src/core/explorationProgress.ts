import {ScratchIndex} from './scratchMap';
import {RecordedRide} from './recordings';
export interface ExplorationProgress {schema:1;xp:number;achievements:string[];quests?:Record<string,{xp:number;completedAt:number}>;}
export const explorationAchievements=[
 {id:'first-tile',name:'First discovery',icon:'compass-outline',goal:1,kind:'tiles'},
 {id:'tiles-100',name:'Neighbourhood explorer',icon:'map-outline',goal:100,kind:'tiles'},
 {id:'tiles-1000',name:'City explorer',icon:'globe-outline',goal:1000,kind:'tiles'},
 {id:'rides-10',name:'Regular rider',icon:'bicycle-outline',goal:10,kind:'rides'},
 {id:'km-100',name:'Beyond the familiar',icon:'trail-sign-outline',goal:100,kind:'km'},
 {id:'week-25',name:'Weekly explorer',icon:'trophy-outline',goal:25,kind:'week'},
 {id:'tiles-10',name:'A new corner',icon:'compass-outline',goal:10,kind:'tiles'},
 {id:'tiles-50',name:'Local explorer',icon:'map-outline',goal:50,kind:'tiles'},
 {id:'tiles-250',name:'Beyond your neighbourhood',icon:'map-outline',goal:250,kind:'tiles'},
 {id:'tiles-500',name:'Across town',icon:'globe-outline',goal:500,kind:'tiles'},
 {id:'tiles-2500',name:'Unfamiliar streets',icon:'globe-outline',goal:2500,kind:'tiles'},
 {id:'rides-3',name:'Finding your rhythm',icon:'bicycle-outline',goal:3,kind:'rides'},
 {id:'rides-25',name:'Everyday adventures',icon:'bicycle-outline',goal:25,kind:'rides'},
 {id:'rides-50',name:'Fifty journeys',icon:'trophy-outline',goal:50,kind:'rides'},
 {id:'rides-100',name:'Century rider',icon:'trophy-outline',goal:100,kind:'rides'},
 {id:'km-10',name:'First ten kilometres',icon:'trail-sign-outline',goal:10,kind:'km'},
 {id:'km-50',name:'Going places',icon:'trail-sign-outline',goal:50,kind:'km'},
 {id:'km-500',name:'Long way round',icon:'trail-sign-outline',goal:500,kind:'km'},
 {id:'km-1000',name:'A thousand kilometres',icon:'trophy-outline',goal:1000,kind:'km'},
 {id:'week-50',name:'A week of discoveries',icon:'compass-outline',goal:50,kind:'week'},
 {id:'week-100',name:'An adventurous week',icon:'trophy-outline',goal:100,kind:'week'},
] as const;
export const emptyExplorationProgress=():ExplorationProgress=>({schema:1,xp:0,achievements:[]});
export function parseExplorationProgress(raw:unknown):ExplorationProgress{const v=raw as ExplorationProgress;if(!v||v.schema!==1||!Number.isSafeInteger(v.xp)||v.xp<0||v.xp>100000000||!Array.isArray(v.achievements)||v.achievements.some(id=>!explorationAchievements.some(a=>a.id===id)))return emptyExplorationProgress();const quests=Object.fromEntries(Object.entries(v.quests||{}).filter(([id,q])=>/^(daily|area):\d{4}-\d{2}-\d{2}$/.test(id)&&q&&Number.isInteger(q.xp)&&q.xp>0&&q.xp<=500&&Number.isFinite(q.completedAt)&&q.completedAt>=0));return {schema:1,xp:v.xp,achievements:[...new Set(v.achievements)],quests};}
export function mergeExplorationProgress(a:ExplorationProgress,b:ExplorationProgress):ExplorationProgress{return {schema:1,xp:Math.max(a.xp,b.xp),achievements:[...new Set([...a.achievements,...b.achievements])],quests:{...a.quests,...b.quests}};}
export function explorationProgress(index:ScratchIndex,rides:RecordedRide[],previous=emptyExplorationProgress(),now=Date.now()){
 const start=new Date(now);start.setHours(0,0,0,0);start.setDate(start.getDate()-(start.getDay()+6)%7);
 const valid=rides.filter(r=>r.status!=='recording'),values={tiles:Object.keys(index.tiles).length,rides:valid.length,km:valid.reduce((n,r)=>n+r.meters,0)/1000,week:Object.values(index.tiles).filter(t=>t.firstVisited>=start.getTime()&&t.firstVisited<=now&&!t.approximate).length};
 const earned=explorationAchievements.filter(a=>values[a.kind]>=a.goal).map(a=>a.id),progress=mergeExplorationProgress(previous,{schema:1,xp:values.tiles*5+Math.floor(values.km)*2+values.rides*10+Object.values(previous.quests||{}).reduce((n,q)=>n+q.xp,0),achievements:earned});
 const level=1+Math.floor(Math.sqrt(progress.xp/100)),base=100*(level-1)**2,next=100*level**2;
 return {progress,level,nextXP:next,levelFraction:(progress.xp-base)/(next-base),weeklyTiles:values.week,weeklyGoal:25,values};
}
