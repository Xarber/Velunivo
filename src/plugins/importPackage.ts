import * as DocumentPicker from 'expo-document-picker';
import {File} from 'expo-file-system';
import {Platform} from 'react-native';
import {MAX_PLUGIN_ARCHIVE,parsePluginArchive} from './archive';
export async function pickPlugin(){
 const result=await DocumentPicker.getDocumentAsync({type:'*/*',copyToCacheDirectory:true,base64:false});
 if(result.canceled)return null;
 const asset=result.assets[0];
 if(!/\.(vpi|zip)$/i.test(asset.name))throw new Error('Choose a .vpi or .zip plugin package.');
 if((asset.size??0)>MAX_PLUGIN_ARCHIVE)throw new Error('Plugin package is too large.');
 const file=Platform.OS==='web'?asset.file:new File(asset.uri);
 if(!file)throw new Error('Invalid plugin archive.');
 if(file.size>MAX_PLUGIN_ARCHIVE)throw new Error('Plugin package is too large.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 return {package:parsePluginArchive(bytes),source:'local:'+asset.name};
}
