import AVFoundation
import ExpoModulesCore

private enum GroupVoiceAudio { static var active = false; static var owner: String? }

// One owned session. Never leave duckOthers active between utterances.
private final class NavigationSpeech: NSObject, AVSpeechSynthesizerDelegate {
  private let synthesizer = AVSpeechSynthesizer()
  private var current: AVSpeechUtterance?
  private var ownsSession = false
  private var watchdog: DispatchWorkItem?
  private var interruption: NSObjectProtocol?
  override init() {
    super.init()
    synthesizer.delegate = self
    synthesizer.usesApplicationAudioSession = true
    interruption = NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] _ in self?.stop() }
  }
  deinit { if let interruption { NotificationCenter.default.removeObserver(interruption) } }
  func stop() {
    current = nil
    watchdog?.cancel(); watchdog = nil
    synthesizer.stopSpeaking(at: .immediate)
    releaseSession()
  }
  private func releaseSession(retry: Int = 0) {
    guard ownsSession else { return }
    if GroupVoiceAudio.active { ownsSession = false; return }
    do {
      try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
      ownsSession = false
    } catch {
      // Wait for a stopped synthesizer to drain its audio queue before retrying.
      guard retry < 6 else { NSLog("Velunivo: audio session deactivation failed: %@", error.localizedDescription); return }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { [weak self] in
        guard let self, self.current == nil, self.ownsSession else { return }
        self.releaseSession(retry: retry + 1)
      }
    }
  }
  func speak(_ text: String, volume: Double, language: String, identifier: String) throws {
    stop()
    let session = AVAudioSession.sharedInstance()
    do {
      if !GroupVoiceAudio.active {
        try session.setCategory(.playback, mode: .voicePrompt, options: [.duckOthers, .mixWithOthers])
        try session.setActive(true); ownsSession = true
      }
      // An active group call owns category/activation; announcements share it.
      let utterance = AVSpeechUtterance(string: text)
      let family = language.components(separatedBy: "-").first ?? language
      let voices = AVSpeechSynthesisVoice.speechVoices().filter { $0.language.components(separatedBy: "-").first == family }
      let selected = voices.first { $0.identifier == identifier }
      // Only an explicitly higher-quality voice overrides the system language default.
      let systemDefault = AVSpeechSynthesisVoice(language: language)
      let best = voices.filter { ($0.quality == .enhanced || $0.quality == .premium) && $0.quality.rawValue > (systemDefault?.quality.rawValue ?? AVSpeechSynthesisVoiceQuality.default.rawValue) }.sorted { $0.quality.rawValue > $1.quality.rawValue }.first
      utterance.voice = selected ?? best ?? systemDefault
      utterance.volume = Float(min(1, max(0, volume)))
      current = utterance
      synthesizer.speak(utterance)
      let timeout = DispatchWorkItem { [weak self, weak utterance] in guard let self, let utterance, self.current === utterance else { return }; self.stop() }
      watchdog = timeout
      DispatchQueue.main.asyncAfter(deadline: .now() + min(60, max(15, Double(text.count) / 8)), execute: timeout)
    } catch { current = nil; releaseSession(); throw error }
  }
  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) { complete(utterance) }
  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) { complete(utterance) }
  private func complete(_ utterance: AVSpeechUtterance) {
    DispatchQueue.main.async { [weak self] in
      guard let self, self.current === utterance else { return }
      self.current = nil; self.watchdog?.cancel(); self.watchdog = nil; self.releaseSession()
    }
  }
}
public final class VelunivoAudioModule: Module {
  private var speech: NavigationSpeech?
  public func definition() -> ModuleDefinition {
    Name("VelunivoAudio")
    Events("voiceCallEnded", "voiceCallMuted", "voiceCallStatus")
    AsyncFunction("setGroupVoiceActive") { (active: Bool, owner: String) in
      let session = AVAudioSession.sharedInstance()
      if active {
        if GroupVoiceAudio.active && GroupVoiceAudio.owner == owner { return }
        self.speech?.stop()
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .defaultToSpeaker])
        // CallKit activates the session after the start action succeeds.
        // Pre-activating it can prevent the didActivate callback and leave RTC muted.
        GroupVoiceAudio.owner = owner
        GroupVoiceAudio.active = true
        VelunivoGroupCall.shared.ended = { [weak self] in self?.sendEvent("voiceCallEnded", [:]) }
        VelunivoGroupCall.shared.muted = { [weak self] muted in self?.sendEvent("voiceCallMuted", ["muted": muted]) }
        VelunivoGroupCall.shared.status = { [weak self] message in self?.sendEvent("voiceCallStatus", ["message": message]) }
        VelunivoGroupCall.shared.start()
      } else {
        guard GroupVoiceAudio.owner == owner else { return }
        GroupVoiceAudio.owner = nil
        VelunivoGroupCall.shared.stop()
        GroupVoiceAudio.active = false
        try session.setActive(false, options: .notifyOthersOnDeactivation)
      }
    }.runOnQueue(.main)
    AsyncFunction("setGroupVoiceMuted") { (muted: Bool, owner: String) in
      guard GroupVoiceAudio.owner == owner else { return }
      VelunivoGroupCall.shared.setMuted(muted)
    }.runOnQueue(.main)
    AsyncFunction("speak") { (text: String, volume: Double, language: String, identifier: String) in
      if self.speech == nil { self.speech = NavigationSpeech() }
      try self.speech?.speak(text, volume: volume, language: language, identifier: identifier)
    }.runOnQueue(.main)
    AsyncFunction("voices") { () -> [[String: String]] in
      AVSpeechSynthesisVoice.speechVoices().map { voice in
        ["identifier": voice.identifier, "name": voice.name, "language": voice.language,
         "quality": voice.quality == .premium ? "Premium" : voice.quality == .enhanced ? "Enhanced" : "Default"]
      }
    }.runOnQueue(.main)
    AsyncFunction("stop") { self.speech?.stop() }.runOnQueue(.main)
    OnDestroy { DispatchQueue.main.async { self.speech?.stop(); self.speech = nil } }
  }
}
