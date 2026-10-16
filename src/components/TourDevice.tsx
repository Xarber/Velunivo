import {useSafeAreaInsets} from 'react-native-safe-area-context';
import React from 'react';
import {Image,View,Platform,useWindowDimensions} from 'react-native';
import {nativeTourScreens} from './tourNativeScreens';
import {usePalette} from './ui';
/** Matching native captures: iPhone 18 Pro, iPad Pro 11-inch, Pixel 11 Pro, neutral Android tablet. */
export default function TourDevice({page}:{page:number}){
 const {width,height}=useWindowDimensions(),insets=useSafeAreaInsets(),p=usePalette(),android=Platform.OS==='android',tablet=android?Math.min(width,height)>=600:Platform.OS==='ios'&&Platform.isPad;
 const shots=android?(tablet?nativeTourScreens.androidTablet:nativeTourScreens.android):tablet?nativeTourScreens.ipad:nativeTourScreens.iphone,source=shots[page%Math.max(1,shots.length)];
 const image=source?Image.resolveAssetSource(source):null,aspect=image?image.width/image.height:tablet?(android?2560/1600:2420/1668):android?1280/2856:1206/2622,availableHeight=Math.max(150,height-insets.top-insets.bottom-420),frameWidth=tablet?Math.max(160,Math.min(600,width-96,availableHeight*aspect)):Math.max(130,Math.min(216,availableHeight*aspect));
 if(!source)return null;
 return <View style={{alignSelf:'center',width:frameWidth,height:(frameWidth-12)/aspect+12,borderRadius:tablet?24:34,borderWidth:6,borderColor:android?'#323638':'#44433F',overflow:'hidden',backgroundColor:p.card,boxShadow:'0 8px 22px #00000025'}}><Image source={source} resizeMode="contain" style={{width:'100%',height:'100%'}}/>{!tablet&&<View pointerEvents="none" style={{position:'absolute',top:android?12:10,left:android?'48.5%':'37%',width:android?'3%':'26%',aspectRatio:android?1:3.4,borderRadius:12,backgroundColor:'#101010'}}/>}</View>;
}
