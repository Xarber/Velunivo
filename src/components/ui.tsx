import {useCoordinateActivity} from '../services/useCoordinateActivity';
import Text from './LocalizedText';
import React, { createContext, useContext, useEffect } from 'react';
import PressMotion from './PressMotion';
import { motionProps, useReducedMotion } from './WebMotion';
import Animated,{Easing,useSharedValue,useAnimatedStyle,withRepeat,withTiming,cancelAnimation,ReduceMotion} from 'react-native-reanimated';
import {AppState, Keyboard, ActivityIndicator, StyleSheet, useColorScheme, View, TextInput, TextInputProps} from 'react-native';
import { Ionicons,MaterialCommunityIcons } from '@expo/vector-icons';
import {t} from '../i18n/core';
import {useLanguage} from '../i18n/react';
const PaletteContext = createContext<ReturnType<typeof useSystemPalette> | null>(null);
export const PaletteProvider = PaletteContext.Provider;
function useSystemPalette() {
  const dark = useColorScheme() === 'dark';
  return { dark, bg: dark ? '#101B21' : '#F4F7F8', card: dark ? '#1A2930' : '#FFFFFF', text: dark ? '#F6FAFC' : '#162C35', muted: dark ? '#9BAEB6' : '#647B86', line: dark ? '#30434B' : '#E6ECEF', accent: dark ? '#64DCC5' : '#007F6D', accentLight:'#007F6D',accentDark:'#64DCC5' };
}
export const usePalette = () => { useLanguage(); const inherited = useContext(PaletteContext); const system = useSystemPalette(); return inherited ?? system; };
export function Button({ title, onPress, secondary = false, disabled = false, loading = false, progress = null, icon = 'chevron-forward' }: { title: string; onPress(): void; secondary?: boolean; disabled?: boolean; loading?: boolean; progress?: number | null; icon?: keyof typeof Ionicons.glyphMap }) {
  const p = usePalette();useLanguage();
  return <PressMotion {...motionProps('button')} accessibilityRole="button" accessibilityLabel={t(title)} accessibilityState={{disabled:disabled || loading,busy:loading}} aria-busy={loading} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: loading ? darkenButton(secondary ? p.line : p.accent) : secondary ? p.line : p.accent, overflow:'hidden', opacity: disabled && !loading ? .4 : pressed ? .75 : 1 }]}>{loading && progress !== undefined && <ButtonProgress fraction={progress} color={secondary?p.line:p.accent}/ >}{loading ? <ActivityIndicator color={secondary ? p.text : p.dark ? '#102A28' : '#fff'} size="small" /> : icon && <Ionicons name={icon} size={19} color={secondary ? p.text : p.dark ? '#102A28' : '#fff'} />}<Text style={{ color: secondary ? p.text : p.dark ? '#102A28' : '#fff', fontSize: 16, fontWeight: '700' }}>{title}</Text></PressMotion>;
}
function darkenButton(color:string){return /^#[a-f0-9]{6}$/i.test(color)?'#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*.62).toString(16).padStart(2,'0')).join(''):color;}
function ButtonProgress({fraction,color}:{fraction:number|null;color:string}) {
 const motion=useSharedValue(0),width=useSharedValue(0),reduced=useReducedMotion();
 useEffect(()=>{const apply=()=>{cancelAnimation(motion);motion.set(0);if(fraction===null&&!reduced&&AppState.currentState==='active')motion.set(withRepeat(withTiming(1,{duration:1400,easing:Easing.linear,reduceMotion:ReduceMotion.System}),-1,false));};apply();const sub=AppState.addEventListener('change',apply);return()=>{sub.remove();cancelAnimation(motion);};},[fraction,motion,reduced]);
 const sweep=useAnimatedStyle(()=>({transform:reduced?[]:[{translateX:width.get()*(-.35+motion.get()*1.35)}]}));
 return <View pointerEvents="none" accessibilityRole="progressbar" accessibilityLabel={t('Progress')} accessibilityValue={fraction===null?undefined:{min:0,max:100,now:Math.round(Math.max(0,Math.min(1,fraction))*100)}} onLayout={event=>width.set(event.nativeEvent.layout.width)} style={{position:'absolute',inset:0}}>{fraction===null?<Animated.View style={[{position:'absolute',top:0,bottom:0,width:reduced?'100%':'35%',backgroundColor:color},sweep]}/>:<View style={{height:'100%',width:`${Math.max(0,Math.min(1,fraction))*100}%`,backgroundColor:color}}/>}</View>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const p = usePalette(),resolving=useCoordinateActivity(props.value??'');useLanguage(); return <View style={{ gap: 6 }}><Text style={{ color: p.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8 }}>{label}</Text><View style={{flexDirection:'row',alignItems:'center',gap:8}}>{resolving&&<ActivityIndicator size="small" color={p.muted}/>}<TextInput returnKeyType="done" onSubmitEditing={Keyboard.dismiss} {...motionProps('field')} accessibilityLabel={t(label)} placeholderTextColor={p.muted} {...props} placeholder={props.placeholder?t(props.placeholder):undefined} style={[styles.field, { flex:1, color: resolving?p.muted:p.text, backgroundColor: p.bg, borderColor: p.line }, props.style]} /></View></View>;
}
export const styles = StyleSheet.create({
  button: { minHeight: 50, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  field: { borderWidth: 1, borderRadius: 13, padding: 13, fontSize: 16 },
  card: { padding: 18, borderRadius: 22, gap: 12 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: 15, lineHeight: 22 },
});

export function IconButton({ label, icon, onPress, disabled = false, muted=false,loading=false }: { label: string; icon: keyof typeof Ionicons.glyphMap|'phone-hangup-outline'|'video-pin'; onPress(): void; disabled?: boolean; muted?:boolean;loading?:boolean }) { const p = usePalette();useLanguage(); return <PressMotion accessibilityRole="button" accessibilityLabel={t(label)} disabled={disabled||loading} onPress={onPress} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: p.line, opacity: disabled&&!loading ? .4 : 1 }}>{loading?<ActivityIndicator size="small" color={p.accent}/>:icon==='phone-hangup-outline'?<MaterialCommunityIcons name="phone-hangup-outline" size={22} color="#D75451"/>:icon==='video-pin'?<MaterialCommunityIcons name="pin" size={22} color={muted?p.muted:p.accent}/>:<Ionicons name={icon} size={22} color={icon === 'trash-outline' ? '#D75451' : muted?p.muted:p.accent} />}</PressMotion>; }
