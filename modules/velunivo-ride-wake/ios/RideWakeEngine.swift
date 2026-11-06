// SPDX-License-Identifier: AGPL-3.0-only
import CoreLocation
import UIKit
import UserNotifications

/// Owns a low-energy wake registration, not a route recorder. No coordinates are persisted.
@MainActor
final class RideWakeEngine: NSObject, @preconcurrency CLLocationManagerDelegate {
  static let shared = RideWakeEngine()
  private let manager = CLLocationManager()
  private let defaults = UserDefaults.standard
  private let enabledKey = "velunivo.rideWake.enabled.v1"
  private let alertKey = "velunivo.rideWake.alertAt.v1"
  private let processStartedAt = Date().timeIntervalSince1970 * 1000
  private var monitoring = false
  private var notificationPending = false
  private var rideActive = false

  func setRideActive(_ active: Bool) { rideActive = active }

  override init() {
    super.init()
    manager.delegate = self
  }

  func resume() {
    guard defaults.bool(forKey: enabledKey),
          manager.authorizationStatus == .authorizedAlways,
          CLLocationManager.significantLocationChangeMonitoringAvailable() else { return }
    if !monitoring {
      manager.startMonitoringSignificantLocationChanges()
      monitoring = true
    }
  }

  func configure(enabled: Bool, title: String, body: String) -> Bool {
    if !enabled {
      for key in defaults.dictionaryRepresentation().keys where key.hasPrefix("velunivo.rideWake.") {
        defaults.removeObject(forKey: key)
      }
      defaults.set(false, forKey: enabledKey)
      manager.stopMonitoringSignificantLocationChanges()
      monitoring = false
      UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["velunivo-ride-wake"])
      UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ["velunivo-ride-wake"])
      return true
    }
    // Permission prompts belong to the foreground settings action, never a cold wake.
    guard manager.authorizationStatus == .authorizedAlways,
          CLLocationManager.significantLocationChangeMonitoringAvailable() else { return false }
    defaults.set(title, forKey: "velunivo.rideWake.title.v1")
    defaults.set(body, forKey: "velunivo.rideWake.body.v1")
    defaults.set(true, forKey: enabledKey)
    resume()
    return monitoring
  }

  func statusJSON() -> String {
    let value: [String: Any] = [
      "enabled": defaults.bool(forKey: enabledKey), "monitoring": monitoring,
      "processStartedAt": processStartedAt, "processId": ProcessInfo.processInfo.processIdentifier,
      "alwaysLocation": manager.authorizationStatus == .authorizedAlways,
      "backgroundRefresh": UIApplication.shared.backgroundRefreshStatus == .available,
      "wakeCount": defaults.integer(forKey: "velunivo.rideWake.count.v1"),
      "lastWakeAt": defaults.double(forKey: "velunivo.rideWake.lastWake.v1")
    ]
    guard let data = try? JSONSerialization.data(withJSONObject: value),
          let text = String(data: data, encoding: .utf8) else { return "{}" }
    return text
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    if manager.authorizationStatus == .authorizedAlways { resume() }
    else { manager.stopMonitoringSignificantLocationChanges(); monitoring = false }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard defaults.bool(forKey: enabledKey), manager.authorizationStatus == .authorizedAlways,
          UIApplication.shared.applicationState != .active,
          UIApplication.shared.backgroundRefreshStatus == .available,
          let latest = locations.last, latest.horizontalAccuracy >= 0,
          latest.timestamp.timeIntervalSinceNow >= -120,
          latest.timestamp.timeIntervalSinceNow <= 10 else { return }
    // Significant change is a wake hint. Do not turn coarse fixes into a fake ride or scratch tile.
    let now = Date().timeIntervalSince1970
    defaults.set(now * 1000, forKey: "velunivo.rideWake.lastWake.v1")
    defaults.set(defaults.integer(forKey: "velunivo.rideWake.count.v1") + 1, forKey: "velunivo.rideWake.count.v1")
    guard !rideActive, !notificationPending, now - defaults.double(forKey: alertKey) >= 300 else { return }
    notificationPending = true
    Task { @MainActor [weak self] in
      guard let self else { return }
      defer { self.notificationPending = false }
      let center = UNUserNotificationCenter.current()
      let settings = await center.notificationSettings()
      guard !self.rideActive, self.defaults.bool(forKey: self.enabledKey),
            [.authorized, .provisional, .ephemeral].contains(settings.authorizationStatus) else { return }
      let record = UNNotificationAction(identifier: "START_RECORDING", title: self.defaults.string(forKey: "velunivo.rideWake.record.v1") ?? "Start recording", options: [.foreground])
      let search = UNNotificationAction(identifier: "SEARCH_DESTINATION", title: self.defaults.string(forKey: "velunivo.rideWake.search.v1") ?? "Find destination", options: [.foreground])
      let category = UNNotificationCategory(identifier: "velunivo-native-ride-wake", actions: [record, search], intentIdentifiers: [])
      var categories = await center.notificationCategories()
      categories = Set(categories.filter { $0.identifier != category.identifier })
      categories.insert(category)
      center.setNotificationCategories(categories)
      let content = UNMutableNotificationContent()
      content.title = self.defaults.string(forKey: "velunivo.rideWake.title.v1") ?? "Velunivo"
      content.body = self.defaults.string(forKey: "velunivo.rideWake.body.v1") ?? "Movement detected. Open Velunivo to connect your scooter and record."
      content.categoryIdentifier = category.identifier
      content.userInfo = ["url": "velunivo:///offline/record-trip", "nativeRideWake": true]
      guard !self.rideActive, self.defaults.bool(forKey: self.enabledKey) else { return }
      do {
        try await center.add(UNNotificationRequest(identifier: "velunivo-ride-wake", content: content, trigger: nil))
        guard !self.rideActive, self.defaults.bool(forKey: self.enabledKey) else {
          center.removePendingNotificationRequests(withIdentifiers: ["velunivo-ride-wake"])
          center.removeDeliveredNotifications(withIdentifiers: ["velunivo-ride-wake"])
          return
        }
        self.defaults.set(now, forKey: self.alertKey)
      } catch { /* Permission/system restrictions must never create a fictitious recording. */ }
    }
  }
}

