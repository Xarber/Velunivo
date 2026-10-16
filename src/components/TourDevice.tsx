import {useSafeAreaInsets} from 'react-native-safe-area-context';
import React from 'react';
import {Image,View,Platform,useWindowDimensions} from 'react-native';
import {nativeTourScreens} from './tourNativeScreens';
import {usePalette} from './ui';
/** Genuine native captures composed with the user's iFrames artwork on Apple platforms. */
export default function TourDevice({page}:{page:number}){
 const {width,height}=useWindowDimensions(),insets=useSafeAreaInsets(),p=usePalette(),android=Platform.OS==='android',tablet=android?Math.min(width,height)>=600:Platform.OS==='ios'&&Platform.isPad;
 const shots=android?(tablet?nativeTourScreens.androidTablet:nativeTourScreens.android):tablet?nativeTourScreens.ipad:nativeTourScreens.iphone,source=shots[page%Math.max(1,shots.length)];
 const image=source?Image.resolveAssetSource(source):null;
 if(!source||!image)return null;
 const frame=android?null:tablet?{asset:require('../../assets/onboarding/frames/ipad-pro-11-landscape.png'),w:2640,h:1880,x:110,y:106,sw:2420,sh:1668,radius:65}:{asset:require('../../assets/onboarding/frames/iphone-17-pro.png'),w:1350,h:2760,x:72,y:69,sw:1206,sh:2622,radius:145};
 const aspect=frame?frame.w/frame.h:image.width/image.height,availableHeight=Math.max(150,height-insets.top-insets.bottom-420),frameWidth=tablet?Math.max(160,Math.min(600,width-64,availableHeight*aspect)):Math.max(130,Math.min(228,availableHeight*aspect));
 if(frame){const scale=frameWidth/frame.w;return <View style={{alignSelf:'center',width:frameWidth,height:frame.h*scale}}><View style={{position:'absolute',left:frame.x*scale,top:frame.y*scale,width:frame.sw*scale,height:frame.sh*scale,borderRadius:frame.radius*scale,overflow:'hidden',backgroundColor:p.card}}><Image source={source} resizeMode="cover" style={{width:'100%',height:'100%'}}/></View><Image pointerEvents="none" source={frame.asset} resizeMode="contain" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/></View>;}
 return <View style={{alignSelf:'center',width:frameWidth,height:frameWidth/aspect,borderRadius:tablet?18:30,overflow:'hidden',backgroundColor:p.card}}><Image source={source} resizeMode="contain" style={{width:'100%',height:'100%'}}/></View>;
}
