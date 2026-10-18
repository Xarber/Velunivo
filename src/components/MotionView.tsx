import React,{useEffect} from 'react';
import {ViewProps} from 'react-native';
import Animated,{Easing,ReduceMotion,useSharedValue,useAnimatedStyle,withTiming} from 'react-native-reanimated';
import {useReducedMotion} from './WebMotion';
/** Stable outer geometry belongs to the host; only content moves, never its anchor. */
export default function MotionView({motionKey,...props}:ViewProps&{motionKey?:boolean}){const reduced=useReducedMotion(),offset=useSharedValue(0);useEffect(()=>{offset.set(reduced?0:6);offset.set(withTiming(0,{duration:200,easing:Easing.bezier(.23,1,.32,1),reduceMotion:ReduceMotion.System}));},[motionKey,offset,reduced]);const motion=useAnimatedStyle(()=>({transform:[{translateY:offset.get()}]}));return <Animated.View {...props} style={[props.style,motion]}/>;}
