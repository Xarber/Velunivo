import {ScratchIndex} from './scratchMap';
import {RecordedRide} from './recordings';
export interface ExplorationProgress {schema:1;xp:number;achievements:string[];}
export const explorationAchievements=[
 {id:'first-tile',name:'First discovery',icon:'compass-outline',goal:1,kind:'tiles'},
 {id:'tiles-100',name:'Neighbourhood explorer',icon:'map-outline',goal:100,kind:'tiles'},
 {id:'tiles-1000',name:'City explorer',icon:'globe-outline',goal:1000,kind:'tiles'},
 {id:'rides-10',name:'Regular rider',icon:'bicycle-outline',goal:10,kind:'rides'},
 {id:'km-100',name:'Beyond the familiar',icon:'trail-sign-outline',goal:100,kind:'km'},
 {id:'week-25',name:'Weekly explorer',icon:'trophy-outline',goal:25,kind:'week'},
] as const;
export const emptyExplorationProgress=():ExplorationProgress=>({schema:1,xp:0,achievements:[]});
export function parseExplorationProgress(raw:unknown):ExplorationProgress{const v=raw as ExplorationProgress;if(!v||v.schema!==1||!Number.isSafeInteger(v.xp)||v.xp<0||v.xp>100000000||!Array.isArray(v.achievements)||v.achievements.some(id=>!explorationAchievements.some(a=>a.id===id)))return emptyExplorationProgress();return {schema:1,xp:v.xp,achievements:[...new Set(v.achievements)]};}
export function mergeExplorationProgress(a:ExplorationProgress,b:ExplorationProgress):ExplorationProgress{return {schema:1,xp:Math.max(a.xp,b.xp),achievements:[...new Set([...a.achievements,...b.achievements])]};}
export function explorationProgress(index:ScratchIndex,rides:RecordedRide[],previous=emptyExplorationProgress(),now=Date.now()){
 const start=new Date(now);start.setHours(0,0,0,0);start.setDate(start.getDate()-(start.getDay()+6)%7);
 const valid=rides.filter(r=>r.status!=='recording'),values={tiles:Object.keys(index.tiles).length,rides:valid.length,km:valid.reduce((n,r)=>n+r.meters,0)/1000,week:Object.values(index.tiles).filter(t=>t.firstVisited>=start.getTime()&&t.firstVisited<=now&&!t.approximate).length};
 const earned=explorationAchievements.filter(a=>values[a.kind]>=a.goal).map(a=>a.id),progress=mergeExplorationProgress(previous,{schema:1,xp:values.tiles*5+Math.floor(values.km)*2+values.rides*10,achievements:earned});
 const level=1+Math.floor(Math.sqrt(progress.xp/100)),base=100*(level-1)**2,next=100*level**2;
 return {progress,level,nextXP:next,levelFraction:(progress.xp-base)/(next-base),weeklyTiles:values.week,weeklyGoal:25,values};
}
