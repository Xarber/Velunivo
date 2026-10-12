import {nativeSharePayload} from '../core/nativeSharePayload';
import {Platform,Share} from 'react-native';
export async function shareLink(url:string,title:string){
 if(Platform.OS==='web'){
  if(navigator.share){try{await navigator.share({title,url});return;}catch(e){if(e instanceof Error && e.name==='AbortError')return;}}
  if(navigator.clipboard){await navigator.clipboard.writeText(url);return;}
  throw new Error('Copy the link shown below.');
 }
 await Share.share(nativeSharePayload(Platform.OS,url,title));
}
