package app.velunivo.groupvoice
import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.telecom.DisconnectCause
import androidx.core.app.NotificationCompat
import androidx.core.app.Person
import androidx.core.telecom.CallAttributesCompat
import androidx.core.telecom.CallControlScope
import androidx.core.telecom.CallsManager
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collect
class GroupVoiceService: Service() {
 companion object {@Volatile var activeOwner:String?=null}
 private val scope=CoroutineScope(SupervisorJob()+Dispatchers.Main)
 private var call:CallControlScope?=null
 private var closing=false
 override fun onCreate(){super.onCreate()
  val manager=getSystemService(NotificationManager::class.java);if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(NotificationChannel("velunivo-group-voice","Velunivo Group Ride",NotificationManager.IMPORTANCE_LOW))
  val end=PendingIntent.getService(this,1808,Intent(this,GroupVoiceService::class.java).setAction("END"),PendingIntent.FLAG_IMMUTABLE)
  val notification=NotificationCompat.Builder(this,"velunivo-group-voice").setSmallIcon(android.R.drawable.ic_btn_speak_now).setOngoing(true).setStyle(NotificationCompat.CallStyle.forOngoingCall(Person.Builder().setName("Velunivo Group Ride").build(),end)).build()
  if(Build.VERSION.SDK_INT>=29)startForeground(1808,notification,ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL) else startForeground(1808,notification)
  if(Build.VERSION.SDK_INT>=26)scope.launch {
   try {
    val manager=CallsManager(this@GroupVoiceService);manager.registerAppWithTelecom(CallsManager.CAPABILITY_BASELINE)
    val attributes=CallAttributesCompat(displayName="Velunivo Group Ride",address=Uri.parse("velunivo:group"),direction=CallAttributesCompat.DIRECTION_OUTGOING,callType=CallAttributesCompat.CALL_TYPE_AUDIO_CALL)
    manager.addCall(attributes,onAnswer={ },onDisconnect={if(!closing)GroupVoiceEvents.send?.invoke("voiceCallEnded",emptyMap());stopSelf()},onSetActive={GroupVoiceEvents.send?.invoke("voiceCallMuted",mapOf("muted" to false))},onSetInactive={GroupVoiceEvents.send?.invoke("voiceCallMuted",mapOf("muted" to true))}) {
     call=this;launch {setActive()};launch {isMuted.collect {GroupVoiceEvents.send?.invoke("voiceCallMuted",mapOf("muted" to it))}}
    }
   } catch(error:Exception){if(error !is CancellationException)GroupVoiceEvents.send?.invoke("voiceCallEnded",emptyMap())}
  }
 }
 override fun onStartCommand(intent:Intent?,flags:Int,startId:Int):Int{if(intent?.action=="END"){GroupVoiceEvents.send?.invoke("voiceCallEnded",emptyMap());stopSelf()};return START_NOT_STICKY}
 override fun onDestroy(){closing=true;scope.launch {try{withTimeoutOrNull(3000){call?.disconnect(DisconnectCause(DisconnectCause.LOCAL))}}finally{scope.cancel()}};stopForeground(STOP_FOREGROUND_REMOVE);super.onDestroy()}
 override fun onBind(intent:Intent?):IBinder?=null
}
