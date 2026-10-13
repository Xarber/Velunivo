package app.velunivo.liveupdates

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class LiveUpdateContent : Record {
  @Field var body: String = ""
  @Field var chip: String = ""
  @Field var url: String = "velunivo:///"
  @Field var updatedAt: Double = 0.0
  @Field var oldLabel: String = ""
}

private object Updates {
  const val CHANNEL = "velunivo-live-rides"
  private const val PREFS = "velunivo-live-updates"
  private val ids = setOf("velunivo-navigation", "velunivo-spectator", "velunivo-test", "velunivo-recording")
  private val handler = Handler(Looper.getMainLooper())
  private val pending = mutableMapOf<String, Runnable>()
  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
  fun valid(id: String) { require(id in ids) { "Unknown ride activity" } }
  @Synchronized fun start(context: Context, id: String) { valid(id); pending.remove(id)?.let(handler::removeCallbacks); prefs(context).edit().remove(id).putBoolean("$id.active", true).apply() }
  @Synchronized fun cancel(context: Context, id: String, dismissed: Boolean = false) {
    valid(id); pending.remove(id)?.let(handler::removeCallbacks)
    prefs(context).edit().putBoolean("$id.active", false).apply()
    if (dismissed) prefs(context).edit().putBoolean(id, true).apply()
    NotificationManagerCompat.from(context).cancel(id.hashCode())
  }
  fun allowed(context: Context): Boolean = Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
  @Synchronized fun publish(context: Context, id: String, content: LiveUpdateContent, stale: Boolean = false): Boolean {
    valid(id)
    if (!prefs(context).getBoolean("$id.active", false) || !allowed(context) || !NotificationManagerCompat.from(context).areNotificationsEnabled() || prefs(context).getBoolean(id, false)) return false
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(NotificationChannel(CHANNEL, "Velunivo rides", NotificationManager.IMPORTANCE_LOW).apply { setSound(null, null); enableVibration(false) })
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(content.url)).setPackage(context.packageName)
    val tap = PendingIntent.getActivity(context, id.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val dismissed = PendingIntent.getBroadcast(context, id.hashCode(), Intent(context, LiveUpdateDismissReceiver::class.java).putExtra("id", id), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val now = System.currentTimeMillis()
    val age = now - content.updatedAt.toLong()
    val old = stale || age > 30000 || age < -30000
    val body = if (old) "${content.oldLabel}\n${content.body}" else content.body
    val builder = NotificationCompat.Builder(context, CHANNEL)
      .setSmallIcon(R.drawable.velunivo_navigation).setContentTitle("Velunivo")
      .setContentText(body).setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setContentIntent(tap).setDeleteIntent(dismissed).setOngoing(true).setAutoCancel(false)
      .setOnlyAlertOnce(true).setSilent(true).setColorized(false).setTimeoutAfter(if (id == "velunivo-test") (90000 - age).coerceAtLeast(1) else 90000)
      .setCategory(NotificationCompat.CATEGORY_NAVIGATION).setPriority(NotificationCompat.PRIORITY_LOW)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setRequestPromotedOngoing(!old).setShortCriticalText(if (old) "" else content.chip.take(7))
    manager.notify(id.hashCode(), builder.build())
    pending.remove(id)?.let(handler::removeCallbacks)
    if (!old) {
      val reminder = Runnable { publish(context, id, content, true) }
      pending[id] = reminder
      handler.postDelayed(reminder, (30000 - age).coerceIn(1, 60000))
    }
    return true
  }
  fun capabilities(context: Context): Map<String, Any?> {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    // Promotion methods were introduced in a minor Android release, so SDK_INT alone is insufficient.
    val method = runCatching { manager.javaClass.getMethod("canPostPromotedNotifications") }.getOrNull()
    val enabled = method?.let { runCatching { it.invoke(manager) as Boolean }.getOrNull() }
    return mapOf("apiLevel" to Build.VERSION.SDK_INT, "promotionSupported" to (method != null), "promotionAllowed" to enabled, "notificationsAllowed" to (allowed(context) && NotificationManagerCompat.from(context).areNotificationsEnabled()))
  }
}

class LiveUpdateDismissReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) { intent.getStringExtra("id")?.let { runCatching { Updates.cancel(context, it, true) } } }
}

class VelunivoLiveUpdatesModule : Module() {
  private fun context(): Context = requireNotNull(appContext.reactContext) { "Android context unavailable" }
  override fun definition() = ModuleDefinition {
    Name("VelunivoLiveUpdates")
    Function("capabilities") { Updates.capabilities(context()) }
    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT >= 33) Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.POST_NOTIFICATIONS)
      else promise.resolve(mapOf("granted" to true))
    }
    AsyncFunction("start") { id: String -> Updates.start(context(), id) }
    AsyncFunction("update") { id: String, content: LiveUpdateContent -> Updates.publish(context().applicationContext, id, content) }
    AsyncFunction("end") { id: String -> Updates.cancel(context(), id) }
  }
}
