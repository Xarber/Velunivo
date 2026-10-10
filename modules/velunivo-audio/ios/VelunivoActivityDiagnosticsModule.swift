import Foundation
import ActivityKit
import ExpoModulesCore

// Read-only installation checks. Never return container paths, location or ride data.
public final class VelunivoActivityDiagnosticsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VelunivoActivityDiagnostics")
    Function("inspect") { () -> [String: Bool] in
      let group = Bundle.main.object(forInfoDictionaryKey: "ExpoWidgetsAppGroupIdentifier") as? String
      let urls = Bundle.main.builtInPlugInsURL.flatMap { try? FileManager.default.contentsOfDirectory(at: $0, includingPropertiesForKeys: nil) } ?? []
      let widgets = urls.compactMap { Bundle(url: $0) }.filter {
        ($0.object(forInfoDictionaryKey: "NSExtension") as? [String: Any])?["NSExtensionPointIdentifier"] as? String == "com.apple.widgetkit-extension"
      }
      let containerAvailable = group.flatMap { FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: $0) } != nil
      var enabled = false
      if #available(iOS 16.2, *) { enabled = ActivityAuthorizationInfo().areActivitiesEnabled }
      return [
        "systemEnabled": enabled,
        "declaredSupport": Bundle.main.object(forInfoDictionaryKey: "NSSupportsLiveActivities") as? Bool == true,
        "extensionBundled": !widgets.isEmpty,
        "groupConfigured": group != nil,
        "groupsMatch": group != nil && widgets.contains { $0.object(forInfoDictionaryKey: "ExpoWidgetsAppGroupIdentifier") as? String == group },
        "sharedContainerAvailable": containerAvailable,
        "layoutStored": containerAvailable && group.flatMap { UserDefaults(suiteName: $0)?.string(forKey: "__expo_widgets_live_activity_VelunivoNavigation_layout") } != nil
      ]
    }
  }
}
