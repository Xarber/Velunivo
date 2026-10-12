import React,{useRef,useState,useMemo,useEffect} from 'react';
import {View,PanResponder,Keyboard,Platform,ViewStyle} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {t} from '../i18n/core';import {usePalette} from './ui';
function Handle({label,index,onStart,onMove,onEnd,onCancel,disabled,onReorder}:{label:string;index:number;onStart(i:number):void;onMove(dy:number):void;onEnd():void;onCancel():void;disabled:boolean;onReorder(from:number,to:number):void}){
 const p=usePalette(),latest=useRef({index,onStart,onMove,onEnd,onCancel,disabled});useEffect(()=>{latest.current={index,onStart,onMove,onEnd,onCancel,disabled};},[index,onStart,onMove,onEnd,onCancel,disabled]);
 // PanResponder stores these callbacks; it does not invoke them during render.
 // eslint-disable-next-line react-hooks/refs
 const responder=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>!latest.current.disabled,onPanResponderGrant:()=>{Keyboard.dismiss();latest.current.onStart(latest.current.index);},onPanResponderMove:(_,g)=>latest.current.onMove(g.dy),onPanResponderRelease:()=>latest.current.onEnd(),onPanResponderTerminate:()=>latest.current.onCancel(),onPanResponderTerminationRequest:()=>false}),[]);
 return <View {...responder.panHandlers} accessibilityRole="adjustable" accessibilityLabel={t(`Reorder ${label}`)} accessibilityActions={[{name:'increment',label:t('Move stop down')},{name:'decrement',label:t('Move stop up')}]} onAccessibilityAction={e=>{if(!disabled)onReorder(index,index+(e.nativeEvent.actionName==='increment'?1:-1));}} style={{width:40,minHeight:48,alignItems:'center',justifyContent:'center',...(Platform.OS==='web'?{cursor:'grab',touchAction:'none'}:{})} as ViewStyle}><Ionicons name="reorder-three" size={26} color={p.muted}/></View>;
}
export default function ReorderRows<T>({items,label,render,onReorder,disabled=false,onDraggingChange}:{items:T[];label(item:T,index:number):string;render(item:T,index:number):React.ReactNode;onReorder(from:number,to:number):void;disabled?:boolean;onDraggingChange?(dragging:boolean):void}){
 const p=usePalette(),positions=useRef<{y:number;height:number}[]>([]),drag=useRef<{from:number;to:number;origin:number}|null>(null),[visual,setVisual]=useState<{from:number;to:number;dy:number}|null>(null);
 const cancel=()=>{drag.current=null;setVisual(null);onDraggingChange?.(false);};
 const reorder=(from:number,to:number)=>{if(to>=0&&to<items.length&&from!==to)onReorder(from,to);};
 const start=(from:number)=>{const pos=positions.current[from];if(!pos)return;drag.current={from,to:from,origin:pos.y+pos.height/2};onDraggingChange?.(true);setVisual({from,to:from,dy:0});};
 const move=(dy:number)=>{const d=drag.current;if(!d)return;const y=d.origin+dy;let to=d.from,best=Infinity;positions.current.slice(0,items.length).forEach((pos,i)=>{const distance=Math.abs(pos.y+pos.height/2-y);if(distance<best){best=distance;to=i;}});d.to=to;setVisual({from:d.from,to,dy});};
 const finish=()=>{const d=drag.current;if(d)reorder(d.from,d.to);cancel();};
 return <View style={{gap:0}}>{items.map((item,i)=><View key={i} onLayout={e=>{positions.current[i]=e.nativeEvent.layout;}} style={{borderTopWidth:i?1:0,borderColor:p.line,backgroundColor:p.card,borderRadius:visual?.from===i?12:0,zIndex:visual?.from===i?10:0,transform:[{translateY:visual?.from===i?visual.dy:0}],opacity:(visual&&visual.from!==i)? .65:1,borderBottomWidth:visual?.to===i&&visual.from!==i?3:0,borderBottomColor:p.accent}}><View style={{flexDirection:'row',alignItems:'flex-start',gap:2}}><View style={{flex:1,minWidth:0}}>{render(item,i)}</View><Handle label={label(item,i)} index={i} disabled={disabled} onStart={start} onMove={move} onEnd={finish} onCancel={cancel} onReorder={reorder}/></View></View>)}</View>;
}
