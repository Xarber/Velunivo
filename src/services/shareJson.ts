import {Platform} from 'react-native';
import {File,Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
export async function shareJson(value:unknown,name:string){const text=JSON.stringify(value,null,2);if(Platform.OS==='web'){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}const file=new File(Paths.cache,name);file.create({overwrite:true});file.write(text);if(!await Sharing.isAvailableAsync())throw new Error('Sharing is unavailable on this device.');await Sharing.shareAsync(file.uri,{mimeType:'application/json',UTI:'public.json'});}
