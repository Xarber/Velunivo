
## 16 October: Android 17 system accuracy prompt

Run 38928468213 installed the fixed 2.4.1 APK and stayed alive, but UIAutomator showed Google Play Services' Location Accuracy sheet for the whole capture deadline. Permission-controller handling did not cover this separate package. Disposable capture devices now decline that optional crowdsourced accuracy service (the emulator supplies GPS fixes directly), and screenshot validation rejects its overlay. This changes no production permission behavior.

## 16 October: Device Hub window launch is not app readiness

Matching Xcode 27.0 runner logs showed that creating the first iPad took 0.5 seconds and boot took 3.6 seconds. Launch Services then blocked opening Device Hub for 30 seconds; that optional window timeout aborted the whole attempt before bootstatus/install. The second create stalled after that interruption. Opening the Device Hub window is now best-effort, like bootstatus; app installation, process survival, page OCR and orientation remain required checks. This avoids treating window readiness as application failure.
