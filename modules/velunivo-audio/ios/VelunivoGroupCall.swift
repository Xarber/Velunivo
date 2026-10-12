import AVFoundation
import CallKit
import WebRTC
final class VelunivoGroupCall: NSObject, CXProviderDelegate {
 static let shared = VelunivoGroupCall()
 var ended: (() -> Void)?
 var muted: ((Bool) -> Void)?
 private var uuid: UUID?
 private var requestedEnd = false
 private let controller = CXCallController()
 private let provider: CXProvider
 override init() {
  let config = CXProviderConfiguration()
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
  action.contactIdentifier = "Velunivo Group Ride"
  controller.request(CXTransaction(action: action)) { [weak self] error in
   if error != nil { self?.uuid = nil; RTCAudioSession.sharedInstance().useManualAudio = false }
  }
 }
 func stop() {
  requestedEnd = true
  if let id = uuid { controller.request(CXTransaction(action: CXEndCallAction(call: id))) { _ in } }
  uuid = nil
  RTCAudioSession.sharedInstance().isAudioEnabled = false
  RTCAudioSession.sharedInstance().useManualAudio = false
 }
 func providerDidReset(_ provider: CXProvider) { uuid = nil; RTCAudioSession.sharedInstance().isAudioEnabled = false; if !requestedEnd { start() } }
 func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
  action.fulfill()
  let update = CXCallUpdate(); update.localizedCallerName = "Velunivo Group Ride"; update.hasVideo = false
  provider.reportCall(with: action.callUUID, updated: update)
  provider.reportOutgoingCall(with: action.callUUID, startedConnectingAt: Date())
  provider.reportOutgoingCall(with: action.callUUID, connectedAt: Date())
 }
 func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
  RTCAudioSession.sharedInstance().isAudioEnabled = false
  uuid = nil; action.fulfill()
  if !requestedEnd { ended?() }
 }
 func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) { muted?(action.isMuted); action.fulfill() }
 func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
  RTCAudioSession.sharedInstance().audioSessionDidActivate(audioSession)
  RTCAudioSession.sharedInstance().isAudioEnabled = true
 }
 func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
  RTCAudioSession.sharedInstance().audioSessionDidDeactivate(audioSession)
  RTCAudioSession.sharedInstance().isAudioEnabled = false
 }
}
