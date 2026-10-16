import {useSafeAreaInsets} from 'react-native-safe-area-context';
import React from 'react';
import {Image,View,useWindowDimensions} from 'react-native';
import {usePalette} from './ui';
/** Web previews stay web previews: responsive browser decoration, no native hardware frame. */
export default function TourDevice({page}:{page:number}){
 const {width,height}=useWindowDimensions(),insets=useSafeAreaInsets(),p=usePalette(),wide=width>=760;
 const frameWidth=wide?Math.min(620,width-96):Math.max(130,Math.min(210,(height-insets.top-insets.bottom-420)*.46)),aspect=wide?1194/834:402/874;
 const shots=wide?[require('../../assets/onboarding/web-desktop-explore.png'),require('../../assets/onboarding/web-desktop-vehicles.png'),require('../../assets/onboarding/web-desktop-library.png'),require('../../assets/onboarding/web-desktop-settings.png')]:[require('../../assets/onboarding/web-mobile-explore.png'),require('../../assets/onboarding/web-mobile-vehicles.png'),require('../../assets/onboarding/web-mobile-library.png'),require('../../assets/onboarding/web-mobile-settings.png')];
 return <View style={{alignSelf:'center',width:frameWidth,borderWidth:1,borderColor:p.line,borderRadius:18,overflow:'hidden',backgroundColor:p.card,boxShadow:'0 8px 24px #00000018'}}><View style={{flexDirection:'row',gap:5,padding:9,backgroundColor:p.line}}>{[0,1,2].map(i=><View key={i} style={{width:5,height:5,borderRadius:3,backgroundColor:p.muted,opacity:.55}}/>)}</View><Image source={shots[page%shots.length]} resizeMode="contain" style={{width:frameWidth-2,height:(frameWidth-2)/aspect}}/></View>;
}
