# Development client handoff

Use GitHub Actions → Build and release → development branch → `development_build=true`, version `2.7.2`. The development binary uses Debug + expo-dev-client and skips embedded release JS. No EAS or local SDK build is required. Workflow run 39395973000 builds native revision aac605c; subsequent JS/plugin code is served by Metro and does not require another binary.

On the Mac, `npm run dev` starts Metro in development-client LAN mode on port 8081. The phones/tablet and Mac must share a reachable network; allow the local network permission. The development client launcher discovers the Mac server, or scan/open the Expo development URL printed by Metro. The hosted origin/PeerServer remain the configured public origin; they are not replaced by Metro. Native module or dependency changes require another development binary.

Only the existing Duo Simulator is authorized for Simulator testing. The owner will install the development IPA on physical iPhone/iPad and explicitly signal when they are ready. Do not operate those devices before that signal. No additional SDK/runtime downloads are needed.

Current handoff deliberately precedes interactive tests. Replay panel sizing, transit viewport refresh, Duo tab/accessory behavior, plugin Worker support and device-client connectivity still need target verification. Native compilation is performed by the workflow while JS work continues. A development IPA is unsigned like this repository's other iOS artifacts and must be installed through the owner's existing supported installation method.
