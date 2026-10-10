import AVFoundation
import ExpoModulesCore

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
  func speak(_ text: String, volume: Double) throws {
    stop()
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playback, mode: .voicePrompt, options: [.duckOthers, .mixWithOthers])
      try session.setActive(true); ownsSession = true
      let utterance = AVSpeechUtterance(string: text)
      utterance.voice = AVSpeechSynthesisVoice(language: "en")
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
    AsyncFunction("speak") { (text: String, volume: Double) in
      if self.speech == nil { self.speech = NavigationSpeech() }
      try self.speech?.speak(text, volume: volume)
    }.runOnQueue(.main)
    AsyncFunction("stop") { self.speech?.stop() }.runOnQueue(.main)
    OnDestroy { DispatchQueue.main.async { self.speech?.stop(); self.speech = nil } }
  }
}
