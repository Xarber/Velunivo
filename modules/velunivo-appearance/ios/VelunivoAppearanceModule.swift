import ExpoModulesCore
import UIKit
public class VelunivoAppearanceModule: Module {
 private weak var mapTabs: UITabBarController?
 private var mapTools: UIStackView?
 private var toolSignature = ""
 private weak var toolNavigation: UINavigationController?
 private weak var toolOwner: UIViewController?
 private var previousToolbarItems: [UIBarButtonItem]?
 private var previousToolbarHidden = true
 private var previousToolbarTransform = CGAffineTransform.identity
 private var railSignature = ""
 private func activeWindow() -> UIWindow? {
  let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
  return scenes.filter { $0.activationState == .foregroundActive }.flatMap { $0.windows }.first { $0.isKeyWindow }
   ?? scenes.flatMap { $0.windows }.first { $0.isKeyWindow }
 }
 private func navigationController(_ root: UIViewController?) -> UINavigationController? {
  guard let root else { return nil }
  if let tabs = root as? UITabBarController { return navigationController(tabs.selectedViewController) ?? tabs.navigationController }
  if let nav = root as? UINavigationController { return navigationController(nav.visibleViewController) ?? nav }
  for child in root.children { if let nav = navigationController(child) { return nav } }
  return nil
 }
 private func clearRailTools() {
  if let nav = toolNavigation, let owner = toolOwner {
   nav.toolbar.transform = previousToolbarTransform
   owner.toolbarItems = previousToolbarItems
   nav.setToolbarHidden(previousToolbarHidden, animated:false)
  }
  toolNavigation = nil; toolOwner = nil; previousToolbarItems = nil; railSignature = ""
 }
 private func railTools(_ rows: [[String: String]], color: String, root: UIViewController?, tabs: UITabBarController) -> Bool {
  guard let window = tabs.view.window else { clearRailTools(); return false }
  let bar = tabs.tabBar, rail = tabs.tabBar.convert(tabs.tabBar.bounds,to:window)
  // UIKit can rotate the bar: bounds describe its local axis, not the visible rail.
  guard !rows.isEmpty, !bar.isHidden, rail.height > rail.width,
        let nav = navigationController(root), let owner = nav.topViewController else { clearRailTools(); return false }
  let signature = rows.description + color
  if toolNavigation !== nav || toolOwner !== owner || railSignature != signature {
   clearRailTools(); toolNavigation = nav; toolOwner = owner
   previousToolbarItems = owner.toolbarItems; previousToolbarHidden = nav.isToolbarHidden; previousToolbarTransform = nav.toolbar.transform
   var value: UInt64 = 0; Scanner(string:color.replacingOccurrences(of:"#",with:"")).scanHexInt64(&value)
   nav.toolbar.tintColor = UIColor(red:CGFloat((value >> 16)&255)/255,green:CGFloat((value >> 8)&255)/255,blue:CGFloat(value&255)/255,alpha:1)
   owner.toolbarItems = rows.prefix(5).compactMap { row in
    guard let id = row["id"], let symbol = row["symbol"] else { return nil }
    let item = UIBarButtonItem(image:UIImage(systemName:symbol,withConfiguration:UIImage.SymbolConfiguration(pointSize:22)),primaryAction:UIAction { [weak self] _ in self?.sendEvent("onMapAction",["id":id]) })
    item.accessibilityLabel = row["label"]; return item
   }
   nav.setToolbarHidden(false,animated:false); railSignature = signature
  }
  // Keep UIKit's adaptive toolbar and its native buttons, above the tab rail.
  // Re-evaluate in window coordinates after each size/placement change.
  nav.toolbar.transform = previousToolbarTransform
  nav.view.layoutIfNeeded()
  let tools = nav.toolbar.convert(nav.toolbar.bounds,to:window)
  if tools.intersects(rail.insetBy(dx:-8,dy:-8)), let parent = nav.toolbar.superview {
   let delta = max(0,tools.maxY - rail.minY + 10)
   let origin = parent.convert(CGPoint.zero,from:window), shifted = parent.convert(CGPoint(x:0,y:-delta),from:window)
   nav.toolbar.transform = previousToolbarTransform.concatenating(CGAffineTransform(translationX:shifted.x-origin.x,y:shifted.y-origin.y))
  }
  return true
 }
 private func tabController(_ root: UIViewController?) -> UITabBarController? {
  guard let root else { return nil }
  if let tabs = root as? UITabBarController { return tabs }
  if let presented = root.presentedViewController, let tabs = tabController(presented) { return tabs }
  for child in root.children { if let tabs = tabController(child) { return tabs } }
  return nil
 }
 public func definition() -> ModuleDefinition {
  Name("VelunivoAppearance")
  Events("onMapAction")
  AsyncFunction("setTabsHidden") { (hidden: Bool) in
   guard let tabs = self.tabController(self.activeWindow()?.rootViewController) else { return }
   if #available(iOS 18.0, *) { tabs.setTabBarHidden(hidden,animated:false) }
   else { tabs.tabBar.isHidden = hidden }
  }.runOnQueue(.main)
  AsyncFunction("setMapSidebarActions") { (rows: [[String: String]], color: String) -> Bool in
   guard #available(iOS 18.0, *) else { return false }
   let root = self.activeWindow()?.rootViewController
   guard let tabs = self.tabController(root) else { return false }
   let available: Bool
   if #available(iOS 27.0, *) { available = tabs.sidebar.isAvailable } else { available = tabs.mode == .tabSidebar }
   let visible = available && !tabs.sidebar.isHidden
   if rows.isEmpty || !visible {
    if tabs.sidebar.bottomBarView === self.mapTools { tabs.sidebar.bottomBarView = nil }
    self.mapTools = nil; self.toolSignature = ""; return self.railTools(rows, color: color, root: root, tabs: tabs)
   }
   self.clearRailTools()
   let signature = rows.description + color
   if self.mapTabs === tabs && self.toolSignature == signature && tabs.sidebar.bottomBarView === self.mapTools { return true }
   if let old = self.mapTabs, old !== tabs, old.sidebar.bottomBarView === self.mapTools { old.sidebar.bottomBarView = nil }
   let stack = UIStackView(); stack.axis = .horizontal; stack.alignment = .center; stack.distribution = .fillEqually
   stack.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 6, leading: 8, bottom: 6, trailing: 8); stack.isLayoutMarginsRelativeArrangement = true
   var value: UInt64 = 0; Scanner(string: color.replacingOccurrences(of: "#", with: "")).scanHexInt64(&value)
   let tint = UIColor(red: CGFloat((value >> 16) & 255)/255, green: CGFloat((value >> 8) & 255)/255, blue: CGFloat(value & 255)/255, alpha: 1)
   for row in rows.prefix(5) {
    guard let id = row["id"], let symbol = row["symbol"] else { continue }
    let button = UIButton(type: .system); button.tintColor = tint; button.accessibilityLabel = row["label"]
    button.setImage(UIImage(systemName: symbol, withConfiguration: UIImage.SymbolConfiguration(pointSize: 22)), for: .normal)
    button.addAction(UIAction { [weak self] _ in self?.sendEvent("onMapAction", ["id": id]) }, for: .touchUpInside)
    button.heightAnchor.constraint(equalToConstant: 44).isActive = true; stack.addArrangedSubview(button)
   }
   self.mapTabs = tabs; self.mapTools = stack; self.toolSignature = signature
   tabs.sidebar.bottomBarView = stack
   return true
  }.runOnQueue(.main)
  AsyncFunction("mapChrome") { () -> [String: Double] in
   guard let window = self.activeWindow() else { return [:] }
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
