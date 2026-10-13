import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Platform,View,Switch,useWindowDimensions} from 'react-native';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import RideMap from '../../../components/RideMap';
import GlassSurface from '../../../components/GlassSurface';
import Text from '../../../components/LocalizedText';
import {Button,Field,IconButton,usePalette,PaletteProvider} from '../../../components/ui';
import {AreaBounds,areaDimensions,validateArea} from '../../../core/mapArea';
import {mapAreaFallback} from '../../../core/mapAreaName';
import {Coord} from '../../../core/types';
import {reverseAreaName} from '../../../services/api';
import {downloadArea} from '../../../services/offline';
import {downloadRoadArea} from '../../../services/offlineRouting';
import {downloadStyle} from '../../../services/mapSettings';
import {useStore} from '../../../services/store';
import {goBack} from '../../../services/navigation';
import {distanceLeft} from '../../../core/rideView';
import {t} from '../../../i18n/core';
export default function DownloadArea(){const system=usePalette(),p={...system,dark:true,text:'#F6FAFC',muted:'#ADBCC6',line:'#30434B',bg:'#101B21',accent:'#64DCC5'},insets=useSafeAreaInsets(),{width,height}=useWindowDimensions(),{places,ready,navigationOptions,vehicleLocked}=useStore(),[center,setCenter]=useState<Coord>(()=>places[0]?.coordinate||[12.4964,41.9028]),[bounds,setBounds]=useState<AreaBounds|null>(null),[name,setName]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState<number|null>(null),[error,setError]=useState(''),[roads,setRoads]=useState(true),[imagery,setImagery]=useState(Platform.OS!=='web'&&!!downloadStyle()),[saved,setSaved]=useState(false),[cardHeight,setCardHeight]=useState(350),[mapHeight,setMapHeight]=useState(height);const nameEdited=useRef(false),request=useRef(0),cancel=useRef<AbortController|undefined>(undefined),alive=useRef(true);
 useEffect(()=>{if(!ready)return;let live=true;void (async()=>{const permission=await Location.getForegroundPermissionsAsync();const fix=permission.granted?await Location.getLastKnownPositionAsync({maxAge:300000}):null;if(live)setCenter(fix?[fix.coords.longitude,fix.coords.latitude]:places[0]?.coordinate||[12.4964,41.9028]);})().catch(()=>{});return()=>{live=false;};},[ready,places]);
 useEffect(()=>{const controller=cancel;return()=>{alive.current=false;controller.current?.abort();};},[]);
 const side=Math.max(120,Math.min(480,width-48,mapHeight-insets.top-insets.bottom-cardHeight-132));
 const rect=useMemo(()=>({x:(width-side)/2,y:insets.top+84,width:side,height:side}),[width,side,insets.top]);
 const selection=useMemo(()=>({rect,onChange:(b:AreaBounds)=>setBounds(previous=>previous&&b.every((value,i)=>Math.abs(value-previous[i])<.000001)?previous:b)}),[rect]);
 useEffect(()=>{if(!bounds||nameEdited.current)return;const counter=request,id=++counter.current,timer=setTimeout(()=>void reverseAreaName(bounds).then(value=>{if(alive.current&&request.current===id&&!nameEdited.current&&value)setName(value);}).catch(()=>{}),1200);return()=>{clearTimeout(timer);counter.current++;};},[bounds]);
 let tooLarge=false;try{if(bounds)validateArea(bounds);}catch{tooLarge=true;}
 const dimensions=bounds?areaDimensions(bounds):null;
 async function download(){
  if(!bounds||busy||vehicleLocked)return;setBusy(true);setProgress(null);setError('');cancel.current=new AbortController();
  const signal=cancel.current.signal;
  try{
   // Always resolve the current square, including when Download precedes the debounce.
   const resolved=nameEdited.current?name.trim():await reverseAreaName(bounds).catch(()=>undefined);
   const label=resolved||mapAreaFallback(bounds,t('Map region'));if(alive.current)setName(label);
   if(signal.aborted)throw new Error('Download cancelled.');
   if(roads)await downloadRoadArea(bounds,label,signal,update=>{if(alive.current)setProgress(update.fraction??null);});
   if(imagery){
    setProgress(null);let failure='';
    const pack=await downloadArea(bounds,label,(_,status)=>{if(alive.current)setProgress(Math.min(1,status.percentage/100));},message=>{failure=message;if(alive.current)setError(message);});
    // Creating a native pack starts its download; it does not mean the tiles are ready.
    if(pack)while(true){if(signal.aborted){await pack.pause();throw new Error('Download cancelled.');}if(failure)throw new Error(failure);const status=await pack.status();if(alive.current)setProgress(Math.min(1,status.percentage/100));if(status.percentage>=100)break;await new Promise(resolve=>setTimeout(resolve,750));}
   }
   if(alive.current){setProgress(1);setSaved(true);}
  }catch(e){if(alive.current)setError(e instanceof Error?e.message:String(e));}finally{if(alive.current)setBusy(false);}
 }

 return <PaletteProvider value={p}><SafeAreaView edges={[]} onLayout={event=>setMapHeight(event.nativeEvent.layout.height)} style={{flex:1,backgroundColor:p.bg}}><View style={{flex:1}} pointerEvents={busy?'none':'auto'}><RideMap routes={[]} selected={null} startPoint={center} areaSelection={selection} follow={false} tilted={false}/></View><View pointerEvents="none" style={{position:'absolute',inset:0}}>{[{top:0,left:0,right:0,height:rect.y},{top:rect.y+side,left:0,right:0,bottom:0},{top:rect.y,left:0,width:rect.x,height:side},{top:rect.y,left:rect.x+side,right:0,height:side}].map((mask,i)=><View key={i} style={{position:'absolute',backgroundColor:'#0005',...mask}}/>)}</View><View pointerEvents="none" style={{position:'absolute',top:rect.y,left:rect.x,width:side,height:side,borderWidth:3,borderColor:p.accent,borderRadius:12}}/><View style={{position:'absolute',top:insets.top+12,left:16,right:16,flexDirection:'row',alignItems:'center',gap:12}}><IconButton label={t('Back to Downloaded Maps')} icon="chevron-back" disabled={busy} onPress={()=>goBack('/offline/maps')}/><GlassSurface expanded style={{padding:12,borderRadius:18}}><Text style={{color:p.text,fontSize:20,fontWeight:'700'}}>Select map area</Text></GlassSurface></View><GlassSurface expanded onLayout={event=>{if(!busy)setCardHeight(event.nativeEvent.layout.height);}} style={{position:'absolute',bottom:insets.bottom+16,left:16,right:16,padding:18,gap:12,borderRadius:24,maxWidth:620,alignSelf:'center'}}><Field label={t('Map name')} value={name} placeholder={t('Map region')} editable={!busy} onChangeText={value=>{nameEdited.current=true;setName(value);}}/>{dimensions&&<Text style={{color:tooLarge?'#E49235':p.muted,fontSize:12}}>{distanceLeft(dimensions.width,navigationOptions.unit)} × {distanceLeft(dimensions.height,navigationOptions.unit)} · {tooLarge?'Zoom in to select a smaller map area.':'Pan and zoom to choose what is inside the square.'}</Text>}<View style={{flexDirection:'row',alignItems:'center',gap:12}}><Text style={{flex:1,color:p.text}}>Offline road network</Text><Switch accessibilityLabel={t('Offline road network')} disabled={busy} value={roads} onValueChange={setRoads}/></View>{Platform.OS!=='web'&&<View style={{flexDirection:'row',alignItems:'center',gap:12}}><Text style={{flex:1,color:p.text}}>Map imagery</Text><Switch accessibilityLabel={t('Map imagery')} disabled={busy||!downloadStyle()} value={imagery} onValueChange={setImagery}/></View>}<Text style={{color:p.muted,fontSize:12}}>Road networks are free. Map imagery requires the native app and a configured download provider. Existing size limits apply.</Text>{!!error&&<Text accessibilityRole="alert" style={{color:'#D75451'}}>{error}</Text>}<Button title={t(saved?'Done':busy?'Downloading…':'Download area')} loading={busy} progress={progress} disabled={!saved&&(!bounds||tooLarge||(!roads&&!imagery)||vehicleLocked)} icon={saved?'checkmark-outline':'download-outline'} onPress={()=>saved?goBack('/offline/maps'):void download()}/>{busy&&<Button title={t('Cancel download')} secondary icon="close" onPress={()=>cancel.current?.abort()}/>}</GlassSurface></SafeAreaView></PaletteProvider>;
}
