package app.velunivo.appearance
import android.content.ComponentName
import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
class VelunivoAppearanceModule: Module() {
 override fun definition() = ModuleDefinition {
  Name("VelunivoAppearance")
  AsyncFunction("setIcon") {theme:String ->
   val aliases=mapOf("default" to "Default","sky" to "Sky","sunset" to "Sunset","forest" to "Forest","dusk" to "Dusk")
   require(aliases.containsKey(theme)) {"Unsupported icon"}
   val context=appContext.reactContext ?: error("Application unavailable")
   val pm=context.packageManager
   val names=aliases.values.map{ComponentName(context.packageName,context.packageName+".Launcher"+it)}
   val selected=ComponentName(context.packageName,context.packageName+".Launcher"+aliases[theme])
   val state=pm.getComponentEnabledSetting(selected)
   if(state==PackageManager.COMPONENT_ENABLED_STATE_ENABLED || (theme=="default" && state==PackageManager.COMPONENT_ENABLED_STATE_DEFAULT)) return@AsyncFunction true
   if(Build.VERSION.SDK_INT>=33){pm.setComponentEnabledSettings(names.map {PackageManager.ComponentEnabledSetting(it,if(it==selected)PackageManager.COMPONENT_ENABLED_STATE_ENABLED else PackageManager.COMPONENT_ENABLED_STATE_DISABLED,PackageManager.DONT_KILL_APP)})}
   else {pm.setComponentEnabledSetting(selected,PackageManager.COMPONENT_ENABLED_STATE_ENABLED,PackageManager.DONT_KILL_APP);names.filter{it!=selected}.forEach{pm.setComponentEnabledSetting(it,PackageManager.COMPONENT_ENABLED_STATE_DISABLED,PackageManager.DONT_KILL_APP)}}
   true
  }
 }
}
