
## 16 October: Android 17 system accuracy prompt

Run 38928468213 installed the fixed 2.4.1 APK and stayed alive, but UIAutomator showed Google Play Services' Location Accuracy sheet for the whole capture deadline. Permission-controller handling did not cover this separate package. Disposable capture devices now decline that optional crowdsourced accuracy service (the emulator supplies GPS fixes directly), and screenshot validation rejects its overlay. This changes no production permission behavior.

## 16 October: Device Hub window launch is not app readiness

Matching Xcode 27.0 runner logs showed that creating the first iPad took 0.5 seconds and boot took 3.6 seconds. Launch Services then blocked opening Device Hub for 30 seconds; that optional window timeout aborted the whole attempt before bootstatus/install. The second create stalled after that interruption. Opening the Device Hub window is now best-effort, like bootstatus; app installation, process survival, page OCR and orientation remain required checks. This avoids treating window readiness as application failure.

Follow-up 38929713469: declining Location Accuracy leaves the Android navigation request unresolved and the OS presents the sheet again. The disposable emulator capture now enables that OS service once, then supplies the same public Milan GPS fixture. Captures still reject any dialog, and no actual user location is supplied. The earlier decline-only approach did not resolve this blocker.

## Hosted iOS resource isolation

Run 38929822521 completed by retaining both galleries, not by capturing fresh screenshots. Its first-boot system readiness and native install operations still stalled on the 7 GB hosted Mac. The next capture avoids loading Device Hub's window and uses simctl installation with matching 27.0 tools. On disposable GitHub runners only, an available preinitialized device is reused directly instead of cloning its launchd state or bootstrapping a new OS data tree. iPhone 17 Pro is still created from its installed device type if no template exists. Local captures continue creating and deleting their own devices, never modifying the user's existing simulators. Fresh app-process, OCR and orientation validation remain mandatory, and fallback is explicitly marked reused.

## Landscape without a Device Hub menu

The headless initialized iPad run 38961819783 progressed through install, fixture seeding and app launch. Its failure moved to orientation: after the first device-orientation command returned success, a later framebuffer request stalled and the fallback tried a Device Hub menu bar that did not exist in the headless session (-1719). Retry also referenced the template UUID deleted by attempt one.

Gallery capture now sets the installed expo-screen-orientation module's `EXDefaultScreenOrientationMask` and iPad supported orientations to landscape **in the downloaded Simulator QA app only**. This uses the real app interface orientation, does not rotate image pixels, does not compile again, and never changes the distributed IPA. Any existing Simulator ad-hoc signature is refreshed with `codesign --sign -` (no signing certificate or security key). Final framebuffer dimensions and page OCR still must pass. Retry creates fresh data after an owned hosted template has been deleted.
