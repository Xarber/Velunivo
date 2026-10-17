import {SafeAreaView as SystemSafeAreaView} from 'react-native-screens/experimental';import {usesLiquidGlassTabs} from '../../../components/NativeTabSafeOverlay';
import {Ionicons} from '@expo/vector-icons';
import {t} from '../../../i18n/core';
import Text from '../../../components/LocalizedText';
import React,{useCallback,useState} from 'react';
import {ScrollView, View,Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router,useFocusEffect} from 'expo-router';
import {Button,styles,usePalette} from '../../../components/ui';
import RoutePreview from '../../../components/RoutePreview';
import RideMap from '../../../components/RideMap';
import {useStore} from '../../../services/store';
import {recordedRides} from '../../../services/rideHistory';
import {RecordedRide} from '../../../core/recordings';
import {journeyTitle} from '../../../core/places';
import {Route} from '../../../core/types';
import {distanceLeft} from '../../../core/rideView';
import {routeLengths} from '../../../core/geo';
import {minutes} from '../../../core/eta';
export default function Library(){
 const p=usePalette(),{places,saved,vehicleLocked,setRoutes,select,requestJourney,navigationOptions:n}=useStore();
 const [history,setHistory]=useState<RecordedRide[]>([]),[error,setError]=useState(''),[previewWidth,setPreviewWidth]=useState(0);
 const widePreviews=previewWidth>=900,previewCardWidth=widePreviews?(previewWidth-36)/4:Math.max(0,previewWidth*.8);
 useFocusEffect(useCallback(()=>{let cancelled=false;void recordedRides().then(r=>{if(!cancelled){setHistory(r);setError('');}}).catch(()=>{if(!cancelled)setError('Recorded rides could not be loaded.');});return()=>{cancelled=true;};},[]));
 const tile=(id:string,name:string,preview:React.ReactNode,detail:string,title:string,icon:React.ComponentProps<typeof Button>['icon'],disabled:boolean,action:()=>void)=><View key={id} style={{width:previewCardWidth,flexGrow:widePreviews?1:0,padding:10,gap:8,backgroundColor:p.bg,borderRadius:18}}>{preview}<Text translate={false} numberOfLines={2} style={{color:p.text,fontWeight:'700',minHeight:0}}>{name}</Text><Text translate={false} numberOfLines={1} style={{color:p.muted,fontSize:11}}>{detail}</Text><Button title={t(title)} icon={icon} secondary disabled={disabled} onPress={action}/></View>;
 return <LibrarySafeArea backgroundColor={p.bg}><ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} contentContainerStyle={{padding:16,paddingBottom:24,gap:18,maxWidth:1100,width:'100%',alignSelf:'center'}}><Text style={[styles.title,{color:p.text}]}>Library</Text>{([{key:'places',title:'Saved Places',icon:'location-outline'},{key:'routes',title:'Saved Routes',icon:'bookmark-outline'},{key:'rides',title:'Recorded Rides',icon:'bicycle-outline'},{key:'memories',title:'Memories',icon:'film-outline'},{key:'maps',title:'Downloaded Maps',icon:'download-outline'}] as const).map(x=><View key={x.key} style={[styles.card,{backgroundColor:p.card}]}>{x.key!=='maps'&&x.key!=='memories' && <>
 <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:10}}><Ionicons name={x.icon} color={p.accent} size={23}/><Text accessibilityRole="header" numberOfLines={1} style={{flex:1,color:p.text,fontSize:18,fontWeight:'700',minWidth:140}}>{x.title}</Text><Pressable accessibilityRole="button" accessibilityLabel={t(`Show all ${x.title}`)} onPress={()=>router.push(`/offline/${x.key}`)} style={{minHeight:44,flexDirection:'row',alignItems:'center',gap:4}}><Text style={{color:p.accent,fontWeight:'600'}}>Show All</Text><Ionicons name="chevron-forward" size={17} color={p.accent}/></Pressable></View>
 {(x.key==='places'?places.length:x.key==='routes'?saved.length:history.length)>0 && <ScrollView horizontal onLayout={event=>setPreviewWidth(event.nativeEvent.layout.width)} showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,flexGrow:widePreviews?1:0}}>
 {x.key==='places' && places.slice(0,3).map(place=>tile(place.id,place.name,<View pointerEvents="none" accessibilityLabel={t(`Map preview of ${place.name}`)} style={{height:112,borderRadius:12,overflow:'hidden'}}><RideMap routes={[]} selected={null} startPoint={place.coordinate} follow={false}/></View>,place.address,'Go here','navigate-outline',vehicleLocked,()=>{requestJourney({start:[0,0],startCurrent:true,end:place.coordinate,startLabel:'Current location',endLabel:place.address,requestedAt:Date.now()});router.navigate('/');}))}
 {x.key==='routes' && saved.slice(0,3).map(r=>tile(r.id,journeyTitle(r.startLabel,r.endLabel,r.name,r.savedAt),<RoutePreview route={r} height={112}/>,distanceLeft(routeLengths(r.coordinates).at(-1)??0,n.unit),'Open','navigate-outline',vehicleLocked,()=>{setRoutes([r]);select(r);router.navigate('/');}))}
 {x.key==='rides' && history.slice(0,3).map(r=>tile(r.id,journeyTitle(r.startLabel,r.endLabel,r.name,r.startedAt),r.preview.length>1?<RoutePreview route={previewRoute(r)} height={112}/>:<View style={{height:112,alignItems:'center',justifyContent:'center'}}><Text style={{color:p.muted}}>No map recorded</Text></View>,[distanceLeft(r.meters,n.unit),minutes(((r.endedAt??r.startedAt)-r.startedAt)/1000),r.batteryUsagePercent!=null?`${r.batteryUsagePercent}%`:null].filter(Boolean).join(' · '),'Replay','play-outline',vehicleLocked || !r.samples || r.status==='recording',()=>router.push({pathname:'/offline/replay',params:{id:r.id}})))}
 <Pressable accessibilityRole="button" accessibilityLabel={t(`Show all ${x.title}`)} onPress={()=>router.push(`/offline/${x.key}`)} style={{width:previewCardWidth,minHeight:210,backgroundColor:p.bg,borderRadius:18,alignItems:'center',justifyContent:'center',gap:12}}><Ionicons name="arrow-forward" size={32} color={p.accent}/><Text style={{color:p.accent,fontWeight:'700'}}>Show All</Text></Pressable></ScrollView>}{(x.key==='places'?!places.length:x.key==='routes'?!saved.length:!history.length) && <Text style={{color:p.muted}}>No {x.title.toLowerCase()} yet.</Text>}
 </>}{(x.key==='maps'||x.key==='memories') && <Button title={t(x.title)} icon={x.icon} secondary onPress={()=>router.push(`/offline/${x.key}`)}/>}</View>)}{!!error && <Text accessibilityRole="alert" style={{color:'#D75451'}}>{error}</Text>}</ScrollView></LibrarySafeArea>;
}
function previewRoute(r:RecordedRide):Route{return{id:`library-${r.id}`,name:r.name,kind:'track',source:'gpx',coordinates:r.preview,steps:[],details:{},warnings:[]};}

function LibrarySafeArea({children,backgroundColor}:{children:React.ReactNode;backgroundColor:string}){const style={flex:1,backgroundColor};return usesLiquidGlassTabs()?<SystemSafeAreaView edges={{top:true,bottom:true,left:true,right:true}} insetType="all" style={style}>{children}</SystemSafeAreaView>:<SafeAreaView edges={['top','left','right','bottom']} style={style}>{children}</SafeAreaView>;}
