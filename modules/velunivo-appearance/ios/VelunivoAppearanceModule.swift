import ExpoModulesCore
import UIKit
import SwiftUI
public class VelunivoAppearanceModule: Module {
 private var mapHost: UIHostingController<VelunivoSidebarControls>?
 private var mapOwner = ""
 private func sidebar(_ window: UIWindow) -> CGRect? {
  func scan(_ view: UIView) -> CGRect? {
   let r = view.convert(view.bounds, to: window)
   if !view.isHidden && view.alpha > 0 && r.width >= 44 && r.width <= 240 && r.height > r.width * 2 && (view is UITabBar || String(describing:type(of:view)).lowercased().contains("tabbar")) {
    let buttons = view.subviews.flatMap { $0.subviews + [$0] }.filter { $0 is UIControl && $0.bounds.height < 100 }
    let bottom = buttons.map { $0.convert($0.bounds,to:window).maxY }.max() ?? (window.safeAreaInsets.top + 260)
    return CGRect(x:r.midX-24,y:min(bottom+12,window.bounds.height-window.safeAreaInsets.bottom-156),width:48,height:144)
   }
   for child in view.subviews { if let found = scan(child) { return found } }
   return nil
  }
  return scan(window)
 }
 public func definition() -> ModuleDefinition {
  Name("VelunivoAppearance")
  Events("onMapAction")
  AsyncFunction("sidebarMapActions") { (owner: String, options: [String: Bool]) -> Bool in
   guard let window = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).flatMap({ $0.windows }).first(where: { $0.isKeyWindow }) else { return false }
   if options["visible"] != true {
    if self.mapOwner == owner { self.mapHost?.view.removeFromSuperview(); self.mapHost?.removeFromParent(); self.mapHost=nil; self.mapOwner="" }
    return false
   }
   guard let rect = self.sidebar(window) else {
    if self.mapOwner == owner { self.mapHost?.view.removeFromSuperview(); self.mapHost?.removeFromParent(); self.mapHost=nil; self.mapOwner="" }
    return false
   }
   let controls = VelunivoSidebarControls(compass: options["compass"] == true, tilted: options["tilted"] == true, overview: options["overview"] == true, action: { [weak self] action in self?.sendEvent("onMapAction",["owner":owner,"action":action]) })
   if let host = self.mapHost { host.rootView=controls } else {
    let host=UIHostingController(rootView:controls);host.view.backgroundColor = .clear;window.rootViewController?.addChild(host);window.addSubview(host.view);host.didMove(toParent:window.rootViewController);self.mapHost=host
   }
   self.mapOwner=owner
   self.mapHost?.view.frame=CGRect(x:rect.minX,y:rect.minY,width:48,height:options["overview"] == true ? 144:96)
   return true
  }.runOnQueue(.main)
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

private struct VelunivoSidebarControls: View {
 let compass: Bool;let tilted: Bool;let overview: Bool;let action:(String)->Void
 var body: some View {
  VStack(spacing:0) {
   Button(action:{action("follow")}) { Image(systemName:compass ? "location.north.circle":"location.fill").font(.title2).frame(width:48,height:48) }
   Button(action:{action("tilt")}) { Text(tilted ? "2D":"3D").font(.headline).frame(width:48,height:48) }
   if overview { Button(action:{action("overview")}) { Image(systemName:"arrow.up.left.and.arrow.down.right").frame(width:48,height:48) } }
  }.buttonStyle(.plain).foregroundStyle(Color.accentColor).background(.regularMaterial,in:Capsule())
 }
}
