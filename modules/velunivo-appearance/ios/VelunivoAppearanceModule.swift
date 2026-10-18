import ExpoModulesCore
import UIKit
public class VelunivoAppearanceModule: Module {
 private weak var mapTabs: UITabBarController?
 private var mapTools: UIStackView?
 private var toolSignature = ""
 private weak var railTabs: UITabBarController?
 private var railToolsView: UIView?
 private var railSignature = ""
 private func activeWindow() -> UIWindow? {
  let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
  return scenes.filter { $0.activationState == .foregroundActive }.flatMap { $0.windows }.first { $0.isKeyWindow }
   ?? scenes.flatMap { $0.windows }.first { $0.isKeyWindow }
 }
 private func clearRailTools() {
  railToolsView?.removeFromSuperview(); railToolsView = nil; railTabs = nil; railSignature = ""
 }
 private func railTools(_ rows: [[String: String]], color: String, root: UIViewController?, tabs: UITabBarController) -> Bool {
  guard #available(iOS 26.0, *) else { return false }
  let bar = tabs.tabBar
  guard !rows.isEmpty, bar.window != nil, !bar.isHidden, bar.bounds.height > bar.bounds.width,
        tabs.view.bounds.height > bar.bounds.height + CGFloat(rows.count * 44) + 48 else { clearRailTools(); return false }
  let signature = rows.description + color
  if railTabs === tabs && railSignature == signature && railToolsView?.superview != nil { return true }
  clearRailTools()
  // UITabAccessory is always a bottom accessory, even beside a vertical tab rail.
  // Constrain native glass actions to the public tab bar's anchors instead.
  let glass = UIGlassEffect(style: .regular); glass.isInteractive = true
  let tools = UIVisualEffectView(effect: glass); tools.translatesAutoresizingMaskIntoConstraints = false
  tools.layer.cornerRadius = 24; tools.clipsToBounds = true
  let stack = UIStackView(); stack.axis = .vertical; stack.alignment = .center; stack.translatesAutoresizingMaskIntoConstraints = false
  var value: UInt64 = 0; Scanner(string: color.replacingOccurrences(of: "#", with: "")).scanHexInt64(&value)
  let tint = UIColor(red:CGFloat((value >> 16)&255)/255,green:CGFloat((value >> 8)&255)/255,blue:CGFloat(value&255)/255,alpha:1)
  for row in rows.prefix(5) {
   guard let id = row["id"], let symbol = row["symbol"] else { continue }
   let button = UIButton(type: .system); button.accessibilityLabel = row["label"]; button.tintColor = tint
   button.setImage(UIImage(systemName:symbol,withConfiguration:UIImage.SymbolConfiguration(pointSize:22)),for:.normal)
   button.addAction(UIAction { [weak self] _ in self?.sendEvent("onMapAction", ["id":id]) }, for:.touchUpInside)
   button.widthAnchor.constraint(equalToConstant:44).isActive = true; button.heightAnchor.constraint(equalToConstant:44).isActive = true
   stack.addArrangedSubview(button)
  }
  tools.contentView.addSubview(stack); tabs.view.addSubview(tools)
  NSLayoutConstraint.activate([
   stack.leadingAnchor.constraint(equalTo:tools.contentView.leadingAnchor,constant:2), stack.trailingAnchor.constraint(equalTo:tools.contentView.trailingAnchor,constant:-2),
   stack.topAnchor.constraint(equalTo:tools.contentView.topAnchor,constant:4),stack.bottomAnchor.constraint(equalTo:tools.contentView.bottomAnchor,constant:-4),
   tools.centerXAnchor.constraint(equalTo:bar.centerXAnchor),tools.bottomAnchor.constraint(equalTo:bar.topAnchor,constant:-10)
  ])
  railTabs = tabs; railToolsView = tools; railSignature = signature
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
