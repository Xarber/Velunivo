import {Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import {t} from '../i18n/core';
/** Opt-in local alerts only. No push tokens or remote notification service. */
export async function requestLocalNotifications(){
 if(Platform.OS==='web')return false;
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('ride-events',{name:t('Local ride notifications'),importance:Notifications.AndroidImportance.DEFAULT});
 const permission=await Notifications.requestPermissionsAsync();return permission.granted;
}
const recent=new Map<string,number>();
export async function notifyRideEvent(id:string,title:string,body:string){
 if(Platform.OS==='web'||Date.now()-(recent.get(id)??0)<60000)return;
 recent.set(id,Date.now());if(recent.size>100)recent.delete(recent.keys().next().value!);
 try{if(!(await Notifications.getPermissionsAsync()).granted)return;await Notifications.scheduleNotificationAsync({content:{title:t(title),body,data:{url:'velunivo:///'},sound:false},trigger:Platform.OS==='android'?{channelId:'ride-events'}:null});}catch{/* Never interrupt a ride for an optional notification. */}
}
