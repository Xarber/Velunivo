import AVFoundation
import CallKit
import WebRTC
final class VelunivoGroupCall: NSObject, CXProviderDelegate {
 static let shared = VelunivoGroupCall()
 var status: ((String) -> Void)?
 var ended: (() -> Void)?
 var muted: ((Bool) -> Void)?
 private var uuid: UUID?
 private var requestedEnd = true
 private var microphoneMuted = false
 private var callStarted = false
 private var lastMuteRequested: Bool?
 private var applicationMuteActions = Set<UUID>()
 private let controller = CXCallController()
 private let provider: CXProvider
 override init() {
  let config = CXProviderConfiguration(localizedName: "Velunivo Group Ride")
  config.supportsVideo = false
  config.maximumCallsPerCallGroup = 1
  config.maximumCallGroups = 1
  config.supportedHandleTypes = [.generic]
  provider = CXProvider(configuration: config)
  super.init()
  provider.setDelegate(self, queue: .main)
 }
 func start() {
  guard uuid == nil else { return }
  let id = UUID(); uuid = id; requestedEnd = false
  RTCAudioSession.sharedInstance().useManualAudio = true
  let action = CXStartCallAction(call: id, handle: CXHandle(type: .generic, value: "Velunivo Group Ride"))
  controller.request(CXTransaction(action: action)) { [weak self] error in
   if error != nil {
    DispatchQueue.main.async {
     guard let self, !self.requestedEnd, self.uuid == id else { return }
     self.uuid = nil
     self.status?("CallKit: \(error!.localizedDescription)")
     // Sideloaded containers may not permit CallKit transactions. The already
     // activated AVAudioSession can still carry in-app WebRTC audio.
     try? AVAudioSession.sharedInstance().setActive(true)
     RTCAudioSession.sharedInstance().audioSessionDidActivate(AVAudioSession.sharedInstance())
     RTCAudioSession.sharedInstance().useManualAudio = false
     RTCAudioSession.sharedInstance().isAudioEnabled = true
    }
   }
  }
 }
 func stop() {
  requestedEnd = true; callStarted = false; lastMuteRequested = nil; applicationMuteActions.removeAll()
  if let id = uuid { controller.request(CXTransaction(action: CXEndCallAction(call: id))) { _ in } }
  uuid = nil
  RTCAudioSession.sharedInstance().isAudioEnabled = false
  RTCAudioSession.sharedInstance().useManualAudio = false
 }
 func providerDidReset(_ provider: CXProvider) { callStarted = false; lastMuteRequested = nil; applicationMuteActions.removeAll(); uuid = nil; RTCAudioSession.sharedInstance().isAudioEnabled = false; if !requestedEnd { start() } }
 func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
  guard uuid == action.callUUID, !requestedEnd else { action.fail(); return }
  let update = CXCallUpdate()
  update.remoteHandle = CXHandle(type: .generic, value: "Velunivo Group Ride")
  update.localizedCallerName = "Velunivo Group Ride"
  update.hasVideo = false
  update.supportsHolding = false
  update.supportsGrouping = false
  update.supportsUngrouping = false
  update.supportsDTMF = false
  provider.reportCall(with: action.callUUID, updated: update)
  action.fulfill()
  provider.reportOutgoingCall(with: action.callUUID, startedConnectingAt: Date())
  provider.reportOutgoingCall(with: action.callUUID, connectedAt: Date())
  provider.reportCall(with: action.callUUID, updated: update)
  callStarted = true; lastMuteRequested = false
  setMuted(microphoneMuted)
 }
 func setMuted(_ value: Bool) {
  microphoneMuted = value
  guard let id = uuid, callStarted, lastMuteRequested != value else { return }
  lastMuteRequested = value
  let action = CXSetMutedCallAction(call: id, muted: value)
  let actionId = action.uuid
  applicationMuteActions.insert(actionId)
  controller.request(CXTransaction(action: action)) { [weak self] error in
   if error != nil { DispatchQueue.main.async {
    guard let self else { return }
    self.applicationMuteActions.remove(actionId)
    if self.uuid == id && self.lastMuteRequested == value { self.lastMuteRequested = nil }
   } }
  }
 }
 func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
  // An old call's asynchronous end transaction may finish after reconnection.
  // It must not end the new call, disable its audio, or change voice settings.
  guard uuid == action.callUUID else { action.fulfill(); return }
  RTCAudioSession.sharedInstance().isAudioEnabled = false
  callStarted = false; lastMuteRequested = nil; applicationMuteActions.removeAll()
  uuid = nil; action.fulfill()
  if !requestedEnd { ended?() }
 }
 func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
  let fromApplication = applicationMuteActions.remove(action.uuid) != nil
  guard uuid == action.callUUID else { action.fulfill(); return }
  // Only a system/user mute action changes JS state. Echoing our queued actions
  // can undo a newer mute or reopen capture after the user has muted it.
  if !fromApplication { microphoneMuted = action.isMuted; lastMuteRequested = action.isMuted; muted?(action.isMuted) }
  action.fulfill()
 }
 func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
  RTCAudioSession.sharedInstance().audioSessionDidActivate(audioSession)
  RTCAudioSession.sharedInstance().isAudioEnabled = true
 }
 func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
  RTCAudioSession.sharedInstance().audioSessionDidDeactivate(audioSession)
  RTCAudioSession.sharedInstance().isAudioEnabled = false
 }
}
