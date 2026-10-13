import React,{useEffect,useMemo,useRef,useState} from 'react';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {cellToLatLng,getResolution,latLngToCell} from 'h3-js';
import RideMap from './RideMap';
import {scratchMap,useScratchIndex} from '../services/scratchMap';
import {useLocation} from '../services/useLocation';
import {scratchTileVisits} from '../core/scratchMap';
import {routeBounds} from '../core/geo';
import {Coord} from '../core/types';
import Text from './LocalizedText';
import {Button,IconButton,styles,usePalette} from './ui';
import {t,languageTag} from '../i18n/core';
export default function ScratchViewer({highlight,close}:{highlight?:string[];close():void}){
 const p=usePalette(),insets=useSafeAreaInsets(),{index}=useScratchIndex(),{fix}=useLocation(true);
 const [tile,setTile]=useState<string|null>(null),[focus,setFocus]=useState<Coord|undefined>(),[locationBounds,setLocationBounds]=useState<[number,number,number,number]>();
 const located=useRef(false);
 const centerHere=()=>{if(!fix)return;const [lon,lat]=fix.coordinate,dy=.014,dx=dy/Math.max(.1,Math.cos(lat*Math.PI/180));setFocus(undefined);setLocationBounds([lon-dx,lat-dy,lon+dx,lat+dy]);located.current=true;};
 useEffect(()=>{if(!highlight&&fix&&!located.current){const [lon,lat]=fix.coordinate,dy=.014,dx=dy/Math.max(.1,Math.cos(lat*Math.PI/180));setLocationBounds([lon-dx,lat-dy,lon+dx,lat+dy]);located.current=true;}},[fix,highlight]);
 const cellKey=(highlight?.length?highlight:Object.keys(index.tiles)).join(',');
 const bounds=useMemo(()=>{const ids=cellKey?cellKey.split(','):[];if(!ids.length)return undefined;return routeBounds(ids.map(id=>{const [lat,lon]=cellToLatLng(id);return [lon,lat] as Coord;}));},[cellKey]);
 const chosen=tile?scratchTileVisits(index,tile):undefined;
 return <View style={{flex:1,backgroundColor:p.bg}}>
  <RideMap routes={[]} selected={null} scratchContext="viewer" scratchHighlight={highlight} position={fix?.coordinate} startPoint={focus} mapBounds={focus?undefined:locationBounds||bounds} onPan={()=>{located.current=true;}} onPick={(coordinate,resolution=10)=>setTile(latLngToCell(coordinate[1],coordinate[0],resolution))}/>
  <View style={{position:'absolute',top:insets.top+12,left:16,right:16,flexDirection:'row',alignItems:'center',gap:14}}>
   <IconButton label={t('Close')} icon="close" onPress={()=>{scratchMap.dismissRecap();close();}}/>
   <View style={[styles.card,{backgroundColor:p.card,padding:12}]}><Text style={{color:p.text,fontWeight:'700'}}>{highlight?'New areas explored':'Scratch map'}</Text></View>
   <View style={{flex:1}}/><IconButton label={t('Use my location')} icon="locate-outline" disabled={!fix} onPress={centerHere}/>
  </View>
  {(tile||!Object.keys(index.tiles).length)&&<View style={[styles.card,{position:'absolute',bottom:insets.bottom+20,left:16,right:16,maxWidth:480,backgroundColor:p.card}]}>
   {chosen?<><Text style={{color:p.text,fontWeight:'700'}}>Explored tile</Text><Text style={{color:p.muted}}>{t('First visited')}: {new Date(chosen.firstVisited).toLocaleString(languageTag())}</Text><Text style={{color:p.muted}}>{t('Last visited')}: {new Date(chosen.lastVisited).toLocaleString(languageTag())}</Text>{chosen.approximate&&<Text style={{color:'#E49235'}}>Recovered from an approximate path. Dates refer to the recorded ride.</Text>}</>:tile&&getResolution(tile)<10?<><Text style={{color:p.text}}>Zoom in to inspect individual tiles.</Text><Button title={t('Zoom in')} icon="add-outline" secondary onPress={()=>{const [lat,lon]=cellToLatLng(tile);setFocus([lon,lat]);setTile(null);}}/></>:<Text style={{color:p.muted}}>{tile?'This tile has not been explored.':'Start a ride to uncover your first tiles.'}</Text>}
  </View>}
 </View>;
}
