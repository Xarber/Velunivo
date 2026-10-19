import React,{useState} from 'react';import {Pressable,PressableProps} from 'react-native';import Animated,{cubicBezier} from 'react-native-reanimated';import {useReducedMotion} from './WebMotion';
const pressCurve=cubicBezier(.23,1,.32,1);
// Native animated wrappers require concrete styles and the native easing object.
const AnimatedPressable=Animated.createAnimatedComponent(Pressable);
export default function PressMotion(props:PressableProps){const [pressed,setPressed]=useState(false),reduced=useReducedMotion();return <AnimatedPressable {...props} pressRetentionOffset={16} onPressIn={e=>{setPressed(true);props.onPressIn?.(e);}} onPressOut={e=>{setPressed(false);props.onPressOut?.(e);}} style={[typeof props.style==='function'?props.style({pressed}):props.style,{transform:[{scale:pressed&&!reduced?.97:1}],transitionProperty:'transform',transitionDuration:reduced?0:pressed?120:80,transitionTimingFunction:pressCurve}]}/>;}
