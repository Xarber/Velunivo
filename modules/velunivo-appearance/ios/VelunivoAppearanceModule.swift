import ExpoModulesCore
import UIKit
public class VelunivoAppearanceModule: Module {
 public func definition() -> ModuleDefinition {
  Name("VelunivoAppearance")
  AsyncFunction("mapChrome") { () -> [String: Double] in
   guard let window = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).flatMap({ $0.windows }).first(where: { $0.isKeyWindow }) else { return [:] }
   func findBar(_ view: UIView) -> UITabBar? {
    if let bar = view as? UITabBar, !bar.isHidden, bar.alpha > 0 { return bar }
    for child in view.subviews { if let bar = findBar(child) { return bar } }
    return nil
   }
   let safe = window.safeAreaInsets
   var metrics: [String: Double] = ["safeTop":Double(safe.top),"safeLeft":Double(safe.left),"safeRight":Double(safe.right)]
   if let bar = findBar(window) {
    let rect = bar.convert(bar.bounds, to: window)
    if rect.midY < window.bounds.midY { metrics["barTop"] = Double(rect.minY); metrics["barBottom"] = Double(rect.maxY) }
   }
   return metrics
  }.runOnQueue(.main)
  AsyncFunction("setIcon") { (theme: String, promise: Promise) in
   let icons = ["sky":"VelunivoSky", "sunset":"VelunivoSunset", "forest":"VelunivoForest", "dusk":"VelunivoDusk"]
   guard theme == "default" || icons[theme] != nil else { promise.reject("ICON", "Unsupported icon"); return }
   guard UIApplication.shared.supportsAlternateIcons else { promise.resolve(false); return }
   let icon = icons[theme]
   guard UIApplication.shared.alternateIconName != icon else { promise.resolve(true); return }
   UIApplication.shared.setAlternateIconName(icon) { error in
    if let error = error { promise.reject("ICON", error.localizedDescription) }
    else { promise.resolve(true) }
   }
  }.runOnQueue(.main)
 }
}
