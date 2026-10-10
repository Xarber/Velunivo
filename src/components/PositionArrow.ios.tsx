import React from 'react';
import { View } from 'react-native';
import { SymbolView } from 'expo-symbols';

// North-pointing SF Symbol keeps camera/marker heading math unchanged.
export default function PositionArrow({ navigating, rotation = 0 }: { navigating: boolean; rotation?: number }) {
  return <View accessibilityLabel={navigating ? 'Navigation position arrow' : 'Current position'} style={{width:44,height:44,alignItems:'center',justifyContent:'center',transform:[{rotate:`${rotation}deg`}]}}>{navigating ? <View style={{width:40,height:40,alignItems:'center',justifyContent:'center',boxShadow:'0 2px 4px #00000025'}}><SymbolView name="location.north.fill" tintColor="white" size={40} style={{position:'absolute',width:40,height:40}} /><SymbolView name="location.north.fill" tintColor="#287CF5" size={34} style={{width:34,height:34}} /></View> : <View style={{width:22,height:22,borderRadius:11,backgroundColor:'#287CF5',borderWidth:3,borderColor:'white',boxShadow:'0 2px 6px #00000025'}} />}</View>;
}
