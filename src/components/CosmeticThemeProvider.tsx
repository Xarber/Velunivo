import React,{useMemo} from 'react';
import {useStore} from '../services/store';
import {cosmeticThemes} from '../core/explorationChallenges';
import {PaletteProvider,usePalette} from './ui';
export default function CosmeticThemeProvider({children}:{children:React.ReactNode}){const p=usePalette(),{navigationOptions:n}=useStore(),theme=cosmeticThemes.find(t=>t.id===n.cosmeticTheme)??cosmeticThemes[0];const {dark,bg,card,text,muted,line}=p;const value=useMemo(()=>({dark,bg,card,text,muted,line,accent:dark?theme.dark:theme.light,...(theme.id==='default'?{}:{bg:dark?({sky:'#111D29',sunset:'#241A18',forest:'#142018',dusk:'#1D1927'}[theme.id]):({sky:'#F1F7FC',sunset:'#FCF5F1',forest:'#F3F8F1',dusk:'#F7F3FC'}[theme.id]),card:dark?({sky:'#1B2C3A',sunset:'#332722',forest:'#223027',dusk:'#2B2639'}[theme.id]):'#FFFFFF'})}),[dark,bg,card,text,muted,line,theme]);return <PaletteProvider value={value}>{children}</PaletteProvider>;}
