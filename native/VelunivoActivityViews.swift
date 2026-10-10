// Compiled into ExpoWidgets by the guarded postinstall patch.
// ActivityKit delivers these props directly; no App Group or JS layout is read.
@available(iOS 16.1, *)
private struct VelunivoActivityData {
  let values: [String: String]
  init(_ props: String) {
    values = props.data(using: .utf8).flatMap { try? JSONDecoder().decode([String: String].self, from: $0) } ?? [:]
  }
  var turn: String { values["turn"] ?? "Open Velunivo for directions" }
  var distance: String { values["distance"] ?? "—" }
  var arrival: String { values["arrival"] ?? "—" }
  var minutes: String { values["minutes"] ?? "—" }
  var remaining: String { values["remaining"] ?? "—" }
  var symbol: String {
    let value = values["symbol"] ?? "arrow.up"
    return ["flag.fill", "arrow.turn.up.left", "arrow.turn.up.right", "arrow.up"].contains(value) ? value : "arrow.up"
  }
}

@available(iOS 16.1, *)
private struct VelunivoActivityBanner: View {
  let context: ActivityViewContext<LiveActivityAttributes>
  var body: some View {
    let data = VelunivoActivityData(context.state.props)
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .top, spacing: 12) {
        Image(systemName: data.symbol).font(.title).foregroundStyle(Color.mint)
        VStack(alignment: .leading, spacing: 4) {
          Text(data.distance).font(.headline).foregroundStyle(Color.mint)
          Text(data.turn).font(.headline).lineLimit(2)
        }
      }
      HStack {
        Text("\(data.arrival) arrival")
        Spacer(minLength: 8)
        Text("\(data.minutes) · \(data.remaining)")
      }.font(.caption)
      if #available(iOS 16.2, *) {
        if context.isStale { Text("Waiting for a navigation update").font(.caption).foregroundStyle(.secondary) }
      }
    }
    .padding(16)
    .activityBackgroundTint(Color(red: 0.04, green: 0.10, blue: 0.13))
    .activitySystemActionForegroundColor(.white)
    .foregroundStyle(.white)
  }
}

@available(iOS 16.1, *)
private struct VelunivoActivitySection: View {
  let props: String
  let sectionName: String
  var body: some View {
    let data = VelunivoActivityData(props)
    switch sectionName {
    case "expandedLeading", "compactLeading", "minimal":
      Image(systemName: data.symbol).foregroundStyle(Color.mint)
    case "expandedTrailing", "compactTrailing":
      Text(data.distance).font(.headline).foregroundStyle(Color.mint)
    case "expandedBottom":
      VStack(alignment: .leading, spacing: 6) {
        Text(data.turn).font(.headline).lineLimit(2)
        Text("\(data.arrival) arrival · \(data.minutes) · \(data.remaining)").font(.caption)
      }
    default:
      EmptyView()
    }
  }
}
