// SPDX-License-Identifier: AGPL-3.0-only
import ExpoModulesCore
import UIKit

@MainActor
public final class VelunivoRideWakeSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    // Recreate the native observer immediately, before React/AsyncStorage initialization.
    RideWakeEngine.shared.resume()
    return false
  }
}

public final class VelunivoRideWakeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VelunivoRideWake")
    AsyncFunction("configure") { (enabled: Bool, title: String, body: String, record: String, search: String) async -> Bool in
      await MainActor.run {
        UserDefaults.standard.set(record, forKey: "velunivo.rideWake.record.v1")
        UserDefaults.standard.set(search, forKey: "velunivo.rideWake.search.v1")
        return RideWakeEngine.shared.configure(enabled: enabled, title: title, body: body)
      }
    }
    AsyncFunction("setRideActive") { (active: Bool) async in
      await MainActor.run { RideWakeEngine.shared.setRideActive(active) }
    }
    AsyncFunction("status") { () async -> String in
      await MainActor.run { RideWakeEngine.shared.statusJSON() }
    }
  }
}
