import {Coord} from './types';
import {RideSample} from './recordings';
import {distance,project} from './geo';
/** Geometry-only noise cleanup. Never snaps to roads or changes original sensor samples.
 * Endpoints, stops, interruptions and deviations above 4m are retained. Each fitting
 * window covers at most 20s/120m; gradual park detours cannot be flattened over a trip. */
export function smoothRecordedSamples(samples:RideSample[]):RideSample[]{
 const result=samples.map(s=>({...s}));let window:number[]=[];
 function fit(indices:number[]){if(indices.length<3)return;const first=result[indices[0]].pathFix!,last=result[indices.at(-1)!].pathFix!;
  if(distance(first.coordinate,last.coordinate)<6)return;
  let split=-1,worst=1,previousAlong=-1;const projections=indices.map(i=>project(result[i].pathFix!.coordinate,[first.coordinate,last.coordinate]));
  for(let j=1;j<indices.length-1;j++){const f=result[indices[j]].pathFix!,threshold=Math.max(1,Math.min(4,f.accuracy*.3)),ratio=projections[j].crossTrack/threshold;if(ratio>worst){worst=ratio;split=j;}if(projections[j].along<previousAlong-1){split=j;worst=2;}previousAlong=projections[j].along;}
  if(split>0){fit(indices.slice(0,split+1));fit(indices.slice(split));return;}
  for(let j=1;j<indices.length-1;j++)result[indices[j]].displayCoordinate=projections[j].coordinate as Coord;
 }
 for(let i=0;i<result.length;i++){const s=result[i],f=s.pathFix;
  if(!f || s.breakBefore || f.speed!==null&&f.speed<1){fit(window);window=[];if(!f || f.speed!==null&&f.speed<1)continue;}
  if(window.length&&(f.timestamp-result[window[0]].pathFix!.timestamp>20000||distance(f.coordinate,result[window[0]].pathFix!.coordinate)>120)){fit(window);window=[window.at(-1)!];}
  window.push(i);
 }
 fit(window);return result;
}
export function recordedTrace(samples:RideSample[]):Coord[][]{const trace:Coord[][]=[];for(const s of samples){const f=s.pathFix===undefined?s.fix:s.pathFix;if(!f)continue;if(!trace.length||s.breakBefore)trace.push([]);trace.at(-1)!.push(s.displayCoordinate||f.coordinate);}return trace;}
