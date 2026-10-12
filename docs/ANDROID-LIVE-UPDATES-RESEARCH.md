# Android Live Updates — feasibility check

Checked 12 October 2026 against installed Expo SDK 57, expo-notifications 57.0.22, expo-widgets 57.0.23 and official documentation.

The current Android ride hook posts local ongoing notifications. It does not send remote push notifications, but it also does not request Android Live Update promotion. It should be described as the ordinary fallback, not full Live Updates support.

Expo's SDK 57 notifications API does not expose promoted-ongoing requests, short critical chip text or progress-centric notification styling. The installed Android source does not contain those APIs either. expo-widgets SDK 57 provides iOS widgets/Live Activities; it is not an Android Live Updates API.

Proper Android Live Updates are feasible without EAS or an account/push service. Android defines them as specially eligible/promoted ongoing notifications, rendered prominently on the Lock Screen, notification drawer and status chip. They require the non-runtime POST_PROMOTED_NOTIFICATIONS manifest permission and a promotion request, together with ongoing/title/allowed-style/channel constraints. Notification permission and user/OEM promotion settings still apply. Do not promise the enhanced surface on every device labelled Android 16: promotion support varies by release/device, and official compatibility requirements refer to API 36.1 and newer.

An Android-specific Expo native module or a narrowly guarded native integration could use AndroidX NotificationCompat promotion/short-critical-text and ProgressStyle APIs. The installed notifications module already depends on AndroidX Core 1.17.0; no Expo SDK migration is inherently required. Expo config supplies the manifest permission; generated android/ remains untouched. The app's navigation/spectator progress would update the same notification identifier locally, with ordinary notification fallback on unsupported systems. Dismissal/demotion must be respected, so an update timer must not simply recreate a dismissed Live Update. Background progress remains limited by actual location/peer delivery; Live Update promotion does not keep PeerJS running on its own.

The next build implements a local Expo Android module with AndroidX Core 1.17, a promoted BigText-style ongoing Live Update request, short status chip, notification permission handling, private navigation and public spectator payloads, and native stale timers. Dismissal is retained for the session and old data is demoted. No remote push service is used. Expo Notifications was removed because it cannot expose these promotion APIs in SDK 57. Source/typechecking and autolinking checks are complete; native compilation and device rendering remain to be validated in GitHub Actions/on Android. Version 1.0.4 retains the ordinary notification implementation.

References:
- Expo SDK 57 Notifications: https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
- Expo SDK 57 Widgets: https://docs.expo.dev/versions/v57.0.0/sdk/widgets/
- Expo Modules: https://docs.expo.dev/modules/overview/
- Android Live Updates: https://developer.android.com/develop/ui/views/notifications/live-update
- AndroidX builder: https://developer.android.com/reference/androidx/core/app/NotificationCompat.Builder
- AndroidX ProgressStyle: https://developer.android.com/reference/androidx/core/app/NotificationCompat.ProgressStyle
- Android compatibility: https://source.android.com/docs/compatibility/17/android-17-cdd
