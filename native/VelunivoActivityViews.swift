// Compiled into ExpoWidgets by the guarded postinstall patch.
// ActivityKit delivers these props directly; no App Group or JS layout is read.
@available(iOS 16.1, *)
private struct VelunivoActivityData {
  let values: [String: Any]
  init(_ props: String) {
    values = props.data(using: .utf8).flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] } ?? [:]
  }
  var pausedLabel: String { values["pausedLabel"] as? String ?? "Waiting for a navigation update" }
  var arrivalLabel: String { values["arrivalLabel"] as? String ?? "Arrival" }
  var timer: String { values["timer"] as? String ?? "—" }
  var recording: Bool { values["recording"] as? Bool ?? false }
  var groups: Int? { guard let count = values["groupCount"] as? Double, count.isFinite, (1...8).contains(count) else { return nil }; return Int(count) }
  var joinRequest: String? { values["joinRequest"] as? String }
  var requestLabel: String { values["requestLabel"] as? String ?? "Join request" }
  var actionLabel: String { values["actionLabel"] as? String ?? "Open ride" }
  var actionURL: URL { let fallback = recording ? "velunivo:///offline/record-trip" : "velunivo:///"; let value = values["actionURL"] as? String ?? fallback; return URL(string: value.hasPrefix("velunivo:") ? value : fallback)! }
  var regroup: String? { values["regroup"] as? String }
  var turn: String { values["turn"] as? String ?? "Open Velunivo for directions" }
  var distance: String { values["distance"] as? String ?? "—" }
  var arrival: String { values["arrival"] as? String ?? "—" }
  var minutes: String { values["minutes"] as? String ?? "—" }
  var remaining: String { values["remaining"] as? String ?? "—" }
  var battery: Double? {
    guard let value = values["batteryPercent"] as? Double, value.isFinite, (0...100).contains(value) else { return nil }
    return value
  }
  var batteryOld: Bool { values["batteryOld"] as? Bool ?? false }
  var batteryUpdatedAt: Date? {
    guard let value = values["batteryUpdatedAt"] as? Double, value.isFinite, value >= 0 else { return nil }
    return Date(timeIntervalSince1970: value / 1000)
  }
  var oldLabel: String { values["oldLabel"] as? String ?? "Old" }
  var viewers: Int? {
    guard let value = values["viewerCount"] as? Double, value.isFinite, (0...256).contains(value) else { return nil }
    return Int(value)
  }
  var batterySymbol: String {
    let value = values["batterySymbol"] as? String ?? "battery.100percent"
    return ["battery.0percent", "battery.25percent", "battery.50percent", "battery.75percent", "battery.100percent", "battery.100percent.bolt"].contains(value) ? value : "battery.100percent"
  }
  var symbol: String {
    if regroup != nil { return "exclamationmark.triangle.fill" }
    let value = values["symbol"] as? String ?? "arrow.up"
    return ["flag.fill", "arrow.turn.up.left", "arrow.turn.up.right", "arrow.up", "record.circle"].contains(value) ? value : "arrow.up"
  }
}

@available(iOS 16.1, *)
private struct VelunivoActivityBanner: View {
  let context: ActivityViewContext<LiveActivityAttributes>
  var body: some View {
    let data = VelunivoActivityData(context.state.props)
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .top, spacing: 12) {
        Image(systemName: data.symbol).font(.title).foregroundStyle(data.regroup == nil ? Color.mint : Color.red)
        VStack(alignment: .leading, spacing: 4) {
          Text(data.distance).font(.headline).foregroundStyle(Color.mint)
          Text(data.turn).font(.headline).lineLimit(2)
          if let warning = data.regroup { Text(warning).font(.headline).foregroundStyle(Color.red).lineLimit(2) }
        }
      }
      HStack {
        Text(data.recording ? data.arrival : "\(data.arrival) \(data.arrivalLabel)")
        Spacer(minLength: 8)
        Text("\(data.minutes) · \(data.remaining)")
      }.font(.caption)
      if let name = data.joinRequest { Label("\(name) · \(data.requestLabel)", systemImage: "person.badge.plus").font(.headline).foregroundStyle(Color.mint) }
      VelunivoActivityBadges(data: data, stale: velunivoActivityIsStale(context))
      HStack {
        Link(destination: data.actionURL) { Label(data.actionLabel, systemImage: data.joinRequest == nil ? "arrow.up.right" : "person.badge.plus").font(.subheadline.weight(.semibold)).padding(.vertical, 8).padding(.horizontal, 12).background(Color.white.opacity(0.12), in: Capsule()) }
        Spacer(minLength: 0)
      }.padding(.top, 4)
      if #available(iOS 16.2, *) {
        if context.isStale { Text(data.pausedLabel).font(.caption).foregroundStyle(.secondary) }
      }
    }
    .padding(20)
    .activityBackgroundTint(Color(red: 0.04, green: 0.10, blue: 0.13))
    .activitySystemActionForegroundColor(.white)
    .foregroundStyle(.white)
  }
}

@available(iOS 16.1, *)
private struct VelunivoActivitySection: View {
  let context: ActivityViewContext<LiveActivityAttributes>
  let sectionName: String
  var body: some View {
    let data = VelunivoActivityData(context.state.props)
    switch sectionName {
    case "expandedLeading":
      VStack(alignment: .leading, spacing: 6) {
        Image(systemName: data.symbol).font(.system(size: 36, weight: .semibold))
        if !data.recording { Text(data.distance).font(.system(size: 16, weight: .semibold)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.8) }
      }.foregroundStyle(Color.mint)
    case "expandedTrailing":
      if data.recording { Text(data.timer).font(.system(size: 22, weight: .semibold)).monospacedDigit().padding(.trailing, 4) }
    case "compactLeading", "minimal":
      Image(systemName: data.symbol).foregroundStyle(Color.mint)
    case "compactTrailing":
      Text(data.recording ? data.timer : data.distance).font(.headline).foregroundStyle(Color.mint)
    case "expandedBottom":
      VStack(alignment: .leading, spacing: 6) {
        Text(data.turn).font(.headline).lineLimit(2)
          if let warning = data.regroup { Text(warning).font(.headline).foregroundStyle(Color.red).lineLimit(2) }
        Text(data.recording ? "\(data.arrival) · \(data.minutes) · \(data.remaining)" : "\(data.arrival) \(data.arrivalLabel) · \(data.minutes) · \(data.remaining)").font(.caption)
        if let name = data.joinRequest { Label("\(name) · \(data.requestLabel)", systemImage: "person.badge.plus").font(.headline).foregroundStyle(Color.mint) }
      VelunivoActivityBadges(data: data, stale: velunivoActivityIsStale(context))
      HStack {
        Link(destination: data.actionURL) { Label(data.actionLabel, systemImage: data.joinRequest == nil ? "arrow.up.right" : "person.badge.plus").font(.subheadline.weight(.semibold)).padding(.vertical, 8).padding(.horizontal, 12).background(Color.white.opacity(0.12), in: Capsule()) }
        Spacer(minLength: 0)
      }.padding(.top, 4)
      }.frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 8).padding(.bottom, 6)
    default:
      EmptyView()
    }
  }
}

@available(iOS 16.1, *)
private func velunivoActivityIsStale(_ context: ActivityViewContext<LiveActivityAttributes>) -> Bool {
  if #available(iOS 16.2, *) { return context.isStale }
  return false
}

@available(iOS 16.1, *)
private struct VelunivoActivityBadges: View {
  let data: VelunivoActivityData
  let stale: Bool
  var body: some View {
    HStack(spacing: 16) {
      if let battery = data.battery {
        let old = stale || data.batteryOld
        let tint: Color = old ? .orange : battery < 20 ? .red : battery < 40 ? .orange : .mint
        HStack(spacing: 5) {
          Image(systemName: old && data.batterySymbol == "battery.100percent.bolt" ? "battery.100percent" : data.batterySymbol)
          Text("\(Int(battery.rounded()))%")
          if old { Text(data.oldLabel) }
          if let date = data.batteryUpdatedAt { Text(date, style: .relative).font(.caption2) }
        }.foregroundStyle(tint)
      }
      if let viewers = data.viewers {
        HStack(spacing: 5) {
          Image(systemName: "eye.fill")
          Text("\(viewers)")
          if stale { Image(systemName: "clock").foregroundStyle(Color.orange) }
        }
      }
      if let count = data.groups { HStack(spacing: 5) { Image(systemName: "person.2.fill"); Text("\(count)") } }
    }.font(.caption)
  }
}
