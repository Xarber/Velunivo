import {cellToLatLng,gridDisk} from 'h3-js';
import {Coord,Route} from './types';
import {ScratchIndex,scratchCell} from './scratchMap';
import {cumulative,pointAt,distance} from './geo';
export function routeTileCount(route:Route,index:ScratchIndex){const cells=new Set<string>(),lengths=cumulative(route.coordinates),total=lengths.at(-1)||0;for(let i=0;i<=Math.min(5000,Math.ceil(total/50));i++){const cell=scratchCell(pointAt(route.coordinates,total*i/Math.max(1,Math.min(5000,Math.ceil(total/50)))));if(!index.tiles[cell])cells.add(cell);}return cells.size;}
export function explorationDetours(route:Route,index:ScratchIndex):Coord[]{const total=cumulative(route.coordinates).at(-1)||0;if(total<500)return [];const middle=pointAt(route.coordinates,total*.5),origin=scratchCell(middle);return gridDisk(origin,3).filter(id=>id!==origin&&!index.tiles[id]).map(id=>{const [lat,lon]=cellToLatLng(id);return [lon,lat] as Coord;}).filter(c=>distance(c,middle)>=150&&distance(c,middle)<=500).sort((a,b)=>distance(a,middle)-distance(b,middle)).slice(0,3);}
export function worthwhileExploration(base:Route,candidate:Route,index:ScratchIndex){const before=cumulative(base.coordinates).at(-1)||0,after=cumulative(candidate.coordinates).at(-1)||0;return before>0&&after<=before*1.25&&!(candidate.safetyWarnings?.length)&&routeTileCount(candidate,index)>routeTileCount(base,index);}
