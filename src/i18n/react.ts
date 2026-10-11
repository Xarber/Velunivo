import {useSyncExternalStore} from 'react';
import {getLocales} from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getLanguageChoice,setLanguageChoice,subscribeLanguage,getLanguage,LanguageChoice,setDeviceLocaleReader} from './core';
setDeviceLocaleReader(()=>getLocales()[0]?.languageTag);
export function useLanguage(){const snapshot=useSyncExternalStore(subscribeLanguage,()=>getLanguageChoice()+':'+getLanguage(),()=>getLanguageChoice()+':'+getLanguage());const [choice,language]=snapshot.split(':');return{choice:choice as LanguageChoice,language,choose:(value:LanguageChoice)=>{setLanguageChoice(value);void AsyncStorage.setItem('ui-language-v1',value).catch(console.warn);}};}
export async function loadLanguage(){try{const value=await AsyncStorage.getItem('ui-language-v1');if(value==='en'||value==='it'||value==='system')setLanguageChoice(value);}catch{/* System remains the default. */}}
