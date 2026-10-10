import {useEffect,useRef,useState} from 'react';
import {Fix} from '../core/types';
import {distance} from '../core/geo';
import {freshFix} from '../core/rideView';
import {nearbyRoadLimit,NearbyWay} from '../core/nearbyRoad';
import {requestJson} from './request';
/** Public OSM lookup, throttled to at most one small-area request per 30 seconds. */
export function useTripRoadLimit(active:boolean,fix:Fix|null,now:number){
  const latest=useRef(fix);useEffect(()=>{latest.current=fix;},[fix]);
  const [area,setArea]=useState<{ways:NearbyWay[];fix:Fix;at:number}|null>(null);
  useEffect(()=>{
    if(!active)return;
    let cancelled=false,lastAttempt=0;
    async function lookup(){const point=latest.current;if(!freshFix(point) || !point || point.accuracy>20 || Date.now()-lastAttempt<30000)return;lastAttempt=Date.now();
      try{const query=`[out:json][timeout:8];way(around:120,${point.coordinate[1]},${point.coordinate[0]})[highway];out tags geom;`;
        const {response,body}=await requestJson('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`data=${encodeURIComponent(query)}`},10000);
        if(!cancelled && response.ok && Array.isArray(body.elements))setArea({ways:body.elements,fix:point,at:Date.now()});
      }catch{/* Road information must never prevent recording. */}
    }
    void lookup();const timer=setInterval(()=>void lookup(),5000);return()=>{cancelled=true;clearInterval(timer);};
  },[active]);
  return active && freshFix(fix,now) && fix && area && now-area.at<60000 && distance(fix.coordinate,area.fix.coordinate)<95 ? nearbyRoadLimit(fix,area.ways) : null;
}
