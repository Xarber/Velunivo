package app.velunivo.groupvoice
import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
object GroupVoiceEvents { var send:((String,Map<String,Any>)->Unit)?=null }
class VelunivoGroupVoiceModule: Module() {
 override fun definition() = ModuleDefinition {
  Name("VelunivoGroupVoice")
  Events("voiceCallEnded","voiceCallMuted")
  OnCreate {GroupVoiceEvents.send={name,body->sendEvent(name,body)}}
  AsyncFunction("start") {owner:String->
   val context=appContext.reactContext ?: error("Application unavailable")
   check(context.checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED){"Microphone permission is required"}
   check(appContext.currentActivity!=null){"Open Velunivo before enabling group voice"}
   GroupVoiceService.activeOwner=owner
   val intent=Intent(context,GroupVoiceService::class.java).putExtra("owner",owner)
   if(android.os.Build.VERSION.SDK_INT>=26)context.startForegroundService(intent) else context.startService(intent)
   Unit
  }
  AsyncFunction("stop") {owner:String->if(GroupVoiceService.activeOwner==owner)appContext.reactContext?.let{it.stopService(Intent(it,GroupVoiceService::class.java))};Unit}
  OnDestroy {appContext.reactContext?.let{it.stopService(Intent(it,GroupVoiceService::class.java))}}
 }
}
