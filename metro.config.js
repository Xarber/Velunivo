const {getDefaultConfig}=require('expo/metro-config');const path=require('path');
const config=getDefaultConfig(__dirname);
config.resolver.resolveRequest=(context,name,platform)=>platform==='web'&&name==='@react-native-async-storage/async-storage'?{type:'sourceFile',filePath:path.resolve(__dirname,'src/services/webAsyncStorage.ts')}:context.resolveRequest(context,name,platform);
module.exports=config;
