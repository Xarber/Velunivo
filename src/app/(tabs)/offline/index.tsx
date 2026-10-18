import {Ionicons} from '@expo/vector-icons';
import {t} from '../../../i18n/core';
import Text from '../../../components/LocalizedText';
import React,{useCallback,useState} from 'react';
import {FlatList,ScrollView,View,Pressable,Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router,useFocusEffect} from 'expo-router';
import {Button,styles,usePalette} from '../../../components/ui';
import RoutePreview from '../../../components/RoutePreview';
import RideMap from '../../../components/RideMap';
import {useStore} from '../../../services/store';
import {recordedRides,subscribeRides} from '../../../services/rideHistory';
import {savedMemories,subscribeMemories} from '../../../services/memories';
import {packs,PackView} from '../../../services/offline';
import {subscribeMapDownloads} from '../../../services/mapDownloads';
import {useSampleData} from '../../../services/sampleData';
import {sampleMemories,sampleMaps} from '../../../core/sampleData';
import {RideMemory} from '../../../core/memories';
import {RecordedRide} from '../../../core/recordings';
import {journeyTitle} from '../../../core/places';
import {Coord} from '../../../core/types';
import {distanceLeft} from '../../../core/rideView';
import {routeLengths} from '../../../core/geo';
import {minutes} from '../../../core/eta';
import {riderInitials} from '../../../groups/model';
const sections=[{key:'places',title:'Saved Places',icon:'location-outline'},{key:'routes',title:'Saved Routes',icon:'bookmark-outline'},{key:'rides',title:'Recorded Rides',icon:'bicycle-outline'},{key:'memories',title:'Memories',icon:'film-outline'},{key:'maps',title:'Downloaded Maps',icon:'download-outline'}] as const;
export default function Library(){
 const p=usePalette(),{places,saved,vehicleLocked,setRoutes,select,requestJourney,navigationOptions:n}=useStore(),sample=useSampleData();
 const [history,setHistory]=useState<RecordedRide[]>([]),[memories,setMemories]=useState<RideMemory[]>([]),[regions,setRegions]=useState<PackView[]>([]),[error,setError]=useState(''),[previewWidth,setPreviewWidth]=useState(0);
 const wide=previewWidth>=900,cardWidth=wide?(previewWidth-36)/4:Math.max(0,previewWidth*.8);
 useFocusEffect(useCallback(()=>{let cancelled=false;const refresh=()=>void Promise.all([recordedRides(),savedMemories(),packs()]).then(([r,m,regions])=>{if(!cancelled){setHistory(r);setMemories(m);setRegions(regions);setError('');}}).catch(()=>{if(!cancelled)setError('Library could not be loaded.');});refresh();const stops=[subscribeRides(refresh),subscribeMemories(refresh),subscribeMapDownloads(refresh)];return()=>{cancelled=true;stops.forEach(stop=>stop());};},[]));
 const allMemories=sample.enabled?[...memories,...sampleMemories]:memories,allMaps=sample.enabled?[...regions,...sampleMaps]:regions;
 const tile=(width:number,id:string,name:string,preview:React.ReactNode,detail:string,title:string,icon:React.ComponentProps<typeof Button>['icon'],disabled:boolean,action:()=>void,faces?:React.ReactNode)=><View key={id} style={{width,padding:10,gap:8,backgroundColor:p.bg,borderRadius:18}}>{preview}{faces}<Text translate={false} numberOfLines={2} style={{color:p.text,fontWeight:'700'}}>{name}</Text><Text translate={false} numberOfLines={1} style={{color:p.muted,fontSize:11}}>{detail}</Text><View style={{marginTop:'auto'}}><Button title={t(title)} icon={icon} secondary disabled={disabled} onPress={action}/></View></View>;
 const preview=(points:Coord[],name:string)=>points.length>1?<RoutePreview route={{id:name,name,kind:'track',source:'gpx',coordinates:points,steps:[],details:{},warnings:[]}} height={112}/>:<View style={{height:112,alignItems:'center',justifyContent:'center'}}><Ionicons name="map-outline" size={32} color={p.muted}/></View>;
 return <SafeAreaView edges={['top','left','right','bottom']} style={{flex:1,backgroundColor:p.bg}}><FlatList data={sections} keyExtractor={x=>x.key} initialNumToRender={2} maxToRenderPerBatch={1} windowSize={3} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} contentContainerStyle={{padding:16,paddingBottom:24,gap:18,maxWidth:1100,width:'100%',alignSelf:'center'}} ListHeaderComponent={<Text style={[styles.title,{color:p.text}]}>Library</Text>} ListFooterComponent={error?<Text accessibilityRole="alert" style={{color:'#D75451'}}>{error}</Text>:null} renderItem={({item:x})=>{const count=x.key==='places'?places.length:x.key==='routes'?saved.length:x.key==='rides'?history.length:x.key==='memories'?allMemories.length:allMaps.length;const open=()=>router.push(`/offline/${x.key}`),tileWidth=wide?(previewWidth-12*(Math.min(4,count)-1))/Math.max(1,Math.min(4,count)):cardWidth;return <View style={[styles.card,{backgroundColor:p.card}]}>
 <View style={{flexDirection:'row',alignItems:'center',gap:10}}><Ionicons name={x.icon} color={p.accent} size={23}/><Text accessibilityRole="header" numberOfLines={1} style={{flex:1,color:p.text,fontSize:18,fontWeight:'700'}}>{x.title}</Text><Pressable accessibilityRole="button" accessibilityLabel={t(`Show all ${x.title}`)} onPress={open} style={{minHeight:44,flexDirection:'row',alignItems:'center',gap:4}}><Text style={{color:p.accent,fontWeight:'600'}}>Show All</Text><Ionicons name="chevron-forward" size={17} color={p.accent}/></Pressable></View>
 {count>0?<ScrollView horizontal onLayout={e=>setPreviewWidth(e.nativeEvent.layout.width)} showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,alignItems:'stretch'}}>
 {x.key==='places'&&places.slice(0,3).map(place=>tile(tileWidth,place.id,place.name,<View pointerEvents="none" style={{height:112,borderRadius:12,overflow:'hidden'}}><RideMap routes={[]} selected={null} startPoint={place.coordinate} follow={false}/></View>,place.address,'Go here','navigate-outline',vehicleLocked,()=>{requestJourney({start:[0,0],startCurrent:true,end:place.coordinate,startLabel:'Current location',endLabel:place.address,requestedAt:Date.now()});router.navigate('/');}))}
 {x.key==='routes'&&saved.slice(0,3).map(r=>tile(tileWidth,r.id,journeyTitle(r.startLabel,r.endLabel,r.name,r.savedAt),<RoutePreview route={r} height={112}/>,distanceLeft(routeLengths(r.coordinates).at(-1)??0,n.unit),'Open','navigate-outline',vehicleLocked,()=>{setRoutes([r]);select(r);router.navigate('/');}))}
 {x.key==='rides'&&history.slice(0,3).map(r=>tile(tileWidth,r.id,journeyTitle(r.startLabel,r.endLabel,r.name,r.startedAt),preview(r.preview,r.name),[distanceLeft(r.meters,n.unit),minutes(((r.endedAt??r.startedAt)-r.startedAt)/1000),r.batteryUsagePercent!=null?`${r.batteryUsagePercent}%`:null].filter(Boolean).join(' · '),'Replay','play-outline',vehicleLocked||!r.samples||r.status==='recording',()=>router.push({pathname:'/offline/replay',params:{id:r.id}})))}
 {x.key==='memories'&&allMemories.slice(0,3).map(m=>{const ride=history.find(r=>r.startedAt<=(m.endedAt??m.startedAt)&&((r.endedAt??r.startedAt)>=m.startedAt));return tile(tileWidth,m.id,m.name,preview(ride?.preview??m.preview??[],m.name),(m.id.startsWith('sample-')?t('Sample')+' · ':'')+new Date(m.startedAt).toLocaleDateString()+' · '+m.riders.length+' '+t('riders'),'Open memories','play-outline',false,()=>router.push({pathname:'/offline/memories',params:{id:m.id}}),<View style={{flexDirection:'row',paddingLeft:4}}>{m.riders.slice(0,5).map((r,i)=><View key={r.id} style={{marginLeft:i?-8:0,width:30,height:30,borderRadius:15,borderWidth:2,borderColor:p.bg,backgroundColor:p.card,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{r.photo?<Image source={{uri:r.photo}} style={{width:26,height:26}}/>:<Text translate={false} style={{color:p.accent,fontSize:10,fontWeight:'700'}}>{riderInitials(r.name)}</Text>}</View>)}</View>);})}
 {x.key==='maps'&&allMaps.slice(0,3).map(m=>tile(tileWidth,m.id,m.name,<View pointerEvents="none" style={{height:112,borderRadius:12,overflow:'hidden'}}><RideMap routes={[]} selected={null} mapBounds={m.bounds} follow={false}/></View>,`${m.id.startsWith('sample-')?t('Sample')+' · ':''}${(m.bytes/1000000).toFixed(1)} MB · ${Math.round(m.percentage)}%`,'Open','map-outline',false,open))}
 {count>3&&<Pressable accessibilityRole="button" accessibilityLabel={t(`Show all ${x.title}`)} onPress={open} style={{width:tileWidth,minHeight:210,backgroundColor:p.bg,borderRadius:18,alignItems:'center',justifyContent:'center',gap:12}}><Ionicons name="arrow-forward" size={32} color={p.accent}/><Text style={{color:p.accent,fontWeight:'700'}}>Show All</Text></Pressable>}</ScrollView>:<Text style={{color:p.muted}}>No {x.title.toLowerCase()} yet.</Text>}
 </View>;}}/></SafeAreaView>;
}
