# Velunivo — request comparison before push/build

Audit date: 12 October 2026. Current checkout: `/private/tmp/Velunivo-update-20261009`.

The pending application version is **1.0.4**. No 1.0.4 push, release tag, build, hosting update or AltSource refresh has been performed. The latest existing release workflow is the completed 1.0.3 run 38221364145. Previously pushed commits bfd4600 (pictures/back navigation) and 6a125f0 (asset consolidation) predate this hold; the latter needs a subsequent workflow run to affect release assets.

This comparison covers the requests visible in the conversation. Earlier features were checked against current code and retained implementation/validation documents; they were not all re-tested on physical devices during this audit. “Implemented” refers to code, not automatically to physical hardware or publication.

## Current update: additions and modifications

| Your request | What changed | Verification / remaining work |
| --- | --- | --- |
| Fix iPad screenshots; understand why iPhone succeeds | Device Hub detection, supported headless orientation, landscape before launch, payload-URL app launch instead of an Open URL alert; early app-path validation; longer map warm-up; bounded five-minute capture attempts and cleanup | Real phone and landscape iPad baselines and compiled-1.0.3 galleries were captured locally. Fresh cloud captures remain unreliable and reused historical assets in 1.0.3. The latest automation changes still need a GitHub run. |
| Speed up builds | Device and Simulator compilation are independent; verification can begin immediately after Simulator build; existing Gradle/ccache integration retained; new DerivedData caches separated by toolchain/platform | Latest completed build took about 27 minutes versus the earlier approximately 41-minute serial build. Additional cache gains are not yet measured; the last iOS ccache was empty. |
| More screens only after both baseline proofs | Explore, navigation, Library and Vehicles gallery using public Milan fixtures; phone images before tablet images | Baseline gate satisfied, both actual galleries captured. New gallery publication remains pending. The 1.0.3 idle iPad Explore panel is still misplaced and must not be treated as proof of the new fix. |
| No screenshots in README or binary releases | Native screenshots publish only in the mutable 1.0 AltSource release; README keeps brand artwork | Configured. Existing historical binary-release assets are not automatically cleaned by changing the workflow. |
| iPad Your ride bottom left | Additional iPad-specific safe-area handling avoids an oversized bottom obstruction from native top tabs | New fix implemented but awaits a newly GitHub-built native binary. The 1.0.3 navigation panel was correct; its idle Explore panel was not. |
| Select an offline area without a route | Library → Downloaded Maps → Download a map area; fixed square, pan/zoom, actual projected bounds, editable automatic locality/city/country name; separate road and imagery switches | Core area tests pass. Full native selection/download UI is not yet device-tested. |
| Free offline provider if possible | Area road-network download uses existing key-free Overpass/OSM local routing; native imagery uses configured licensed Stadia provider | Offline road calculation is real. Free downloaded imagery is not implemented; web does not bulk-cache imagery. Existing small-region/download quotas remain. |
| More room between current location and saved places | Added spacing in EndpointPicker | Implemented; latest visual pass pending. |
| Only IPA/APK/app.zip/build info; web.zip allowed | Workflow now retains IPA, APK, Simulator app ZIP, web ZIP and consolidated build_info.json with metadata, hashes, toolchains and diagnostics | Generator tests pass. Current 1.0.3 release still has old auxiliary assets; publication/cleanup pending. Special 1.0 source assets are deliberately exempt. |
| Choose picture from library/files/camera; center-square crop | Personal-vehicle picture sources and centered square conversion; previous pictures retained | Committed earlier; crop tests pass. Physical camera/library selection still needs an installed-device check. |
| Back arrows actually go back | Shared goBack uses actual history, with replace fallback when no history exists | Committed earlier; not every back interaction has been retested physically. |
| Straighten GPS noise without erasing detours | Geometry-only cleanup on completed new recordings, bounded 20-second/120-metre windows and at most 4-metre correction corridor; respects stops and interruptions; raw GPS/sensors retained | Unit tests pass. JSON preserves raw data; replay/GPX use cleaned display coordinates. Old completed rides are not bulk-migrated. More real-ride evaluation remains. |
| Loading replaces the working button icon | Button supports loading state; route planning uses Plan a ride / Plan bicycle & car routes; keeps indicator when replacing an existing selected route; related actions disabled | Implemented. Full browser visual regression pass is still pending, so not claiming every legacy asynchronous button has been converted. |
| Library/deeplink route requests show progress | Existing queued route requests now use the same planner button loading state; validation uses queued stops rather than stale screen state | Implemented, final interaction regression pending. |
| Sharing first; personal vehicles by frequency | Sharing preset sorts first; remaining vehicles sorted by completed recorded usage with stable ties | Implemented. Dedicated sorting/UI regression coverage still needs expansion. |
| Sharing name fixed, speeds/tuning editable, no range/pictures | Immutable preset identity/icon; hide Bluetooth, range/battery and appearance menus; preserve editable hardware/local limits and ETA tuning | Implemented, including restore/update enforcement. No shared-vehicle Bluetooth association added. |
| Sharing usage/km/CO2 | Recorded rental count and distance; optional configurable car-emission comparison | CO2 is explicitly a scenario, not measured actual environmental saving. No fabrication of fleet/charging/manufacturing emissions. |
| Never ask Sharing E-Scooter battery usage | Recorder never marks its rides pending; prompt selector also skips older pending sharing rides | Regression test passes. Global setting still applies to personal vehicles. |
| Lock Screen for someone else's trip | Separate spectator iOS Live Activity using arrival, time/distance left and freshness; no private speed, battery or telemetry passed | Implemented; fresh native rendering and real-phone background validation pending. |
| Android Live Activities | Silent ongoing ride/shared-trip notification, notification permission and stale replacement | Implemented using expo-notifications ~57.0.22. Android notification is not Apple's ActivityKit; actual Android validation pending. |
| Continuous background shared-trip updates | Existing peer recovery retained; updates publish while delivered and freshness is visible; foreground reconnection | Guaranteed continuous iOS background reception is not implemented. No APNs push relay was added. OS suspension can pause PeerJS; stale marking/recovery remains the fallback. |
| Permanent pairing instead of accounts | One-use code, explicit Pair this device/other-device approval, 64-byte secret, AES-GCM authenticated packets with replay rejection, hashed peer IDs, persistent two-device association | Actual isolated two-browser pairing/first merge/reload recovery/unpair passed. Native↔native/native↔web validation pending. |
| Automatic merges at startup and periodically | Private-server-only root connection, foreground/startup recovery and 30-second checks; stable item IDs and revision-based merge; active rides pause imports | Browser flow tested. Deletions remain local, and each device keeps its UI preferences. Offline/background timers cannot be promised. |
| Unpair only while both connected | Other-device approval and completion exchange before clearing association | Browser test confirms both keys cleared. Interrupted unpairing under a network partition still needs additional stress testing. |
| Sensitive sync on private service only | Bluetooth app associations/credentials and map key participate in private sync; public fallback never used for permanent pairing | Crypto/private-envelope tests pass. OS Bluetooth grants/bonding are not portable and may still require granting access on the other device. |
| File export / Device Connection submenus | Split Data transfer; dated stored backup list with Create, download, delete, import/merge/confirmed replace; connection code at top and create action below | Browser create/download/delete and secret exclusion tested; replacement UI added but import/overwrite full UI test pending. |
| Bluetooth diagnostics submenu | Developer-only broad native discovery; device identifiers, services, manufacturer/service bytes and RSSI when exposed; bounded read-only GATT inspection; one JSON export | Core serialization tests pass. Web can only inspect chooser-granted services and does not expose full ads/RSSI. No physical reseller device tested; not a production support plugin. |
| Looks like you're riding prompt | Existing Explore GPS stream requires sustained fresh accurate movement; prompt offers vehicle picker, Start recording, Plan a ride and dismiss | Detector tests pass; fresh physical GPS interaction not tested. Once per app JS session on idle Explore; never starts recording without explicit tap. |
| Localize additions and version/changelog | New strings in Italian/Spanish/French/German/Portuguese; package/native/lock versions 1.0.4 and four short What's New cards | Italian coverage test and typecheck pass. Other languages still benefit from native-speaker review. No release published. |

## Earlier requests retained in the existing app

These are already present rather than all newly implemented in this pending update.

| Earlier request group | Current implementation / important qualification |
| --- | --- |
| iOS-first Expo project, responsive web/tablets, public GitHub repo | Velunivo project exists; phone/tablet/desktop floating-map layouts and GitHub workflows. No EAS submission. |
| Bicycle and car-road alternatives with scooter/ebike ETA | Genuine provider/local routes and configurable speed ceilings, local riding limits, stop-inclusive learned pace and elevation-aware energy estimates. |
| No predicted traffic in scheduled ETA | Depart-now default, expandable date/time scheduling and explicit no-traffic ETA notice. Natural-language date input stays hidden. |
| Address rather than coordinate-only entry | Address/POI search, full address labels, saved places and key-free reverse geocoding; failed reverse lookup retains coordinates. |
| Apple Maps-style multiple stops | One ordered start/stops/arrival card, drag rearrangement, automatic one-second search, inline transparent map button; waypoint pins, instructions and Library metadata. |
| Current GPS startup and reroute origin | Existing foreground location stream and current-location start; automatic/manual replanning uses current position. Permissions remain required. |
| Native iOS map and key-free Android/web maps | Apple MapKit by default on iOS; MapLibre/OpenFreeMap elsewhere; downloaded native regions selected automatically when covering the ride. |
| Compass/forward/pocket heading | Compass primary, sustained mismatch selects movement course; camera deadzones/timeouts, tilt option and overview; map-relative arrow rotation. Actual new iPad safe-area fix remains pending. |
| Speed, mapped limit, arrival/minutes/distance, route overview | Existing dashboards and persistent map controls. Unknown mapped limits remain unknown, never inferred from vehicle hardware cap. |
| Navigation arrow/icons/glass/animation | Native iOS navigation arrow, supported liquid glass/native tabs, darker expanded sheet, cross-platform animations and reduced-motion support. |
| Route warning rather than blanket rejection | Available candidates can be acknowledged after countdown; no usable geometry offers Apple/Google Maps endpoint links. Cannot invent a usable route when the provider returns none. |
| Screen stays awake during active rides | Existing keep-awake integration. |
| Voice ducking/volume/global speech settings | Existing native ducking cleanup, Loud/Quiet/Off, global voice/motion switches, default/higher-quality explicit voice selection and compact voice list. Siri voices only when exposed by OS. |
| Record-only dashboard, grey trace, GPS deadzone | Existing destination-free dashboard and filtered accumulated movement; new post-finish display cleanup supplements it. |
| Minimum ride lengths and save warning | 100 m usual accumulated-distance floor; 15 m for a destination within 100 m; discarded rides do not prompt battery; warning shown. No optional save-anyway override added. |
| Vehicle list/edit submenus/multiple vehicles/icons/picture history | Existing management hierarchy, collapsed selection and green EDIT label; this update specializes the Sharing preset and adds picture sources. |
| Library places/routes/rides, previews, replay, share | Existing responsive preview cards, submenus, saved-place rename, descriptive trip titles, Start again, GPX/share actions and developer JSON/replay telemetry. |
| Global units, General first, grouped Settings | Existing settings structure retained; data transfer now has two submenus and diagnostics only under Developer Options. |
| Hidden developer controls | Triple-tap/version gate, page/30-second hiding, simulation/telemetry/Live Activity test and clear data; latest addition diagnostics. Version remains non-pointer. |
| Welcome once, repeat tour, per-version What's New/history | Existing welcome/settings replay and full release history; 1.0.4 highlights added locally. |
| Universal BLE plugins and real Xiaomi family support | Existing bridge/registry/transport/shared telemetry/session persistence, global preferences and GPS fallback. No extra manufacturer plugin added, as requested. |
| Sharing vehicles cannot pair; forget pairing on deletion | Existing policy enforcement remains; public rental not connectable. |
| Browser BLE, discovery/auth/retry | Existing browser chooser and verified family filters plus FE95/headlight reconnect; Firefox has no Web Bluetooth. Physical web pairing succeeded earlier in the conversation; new native fixes require device validation. |
| Battery below limit text; expanded telemetry; stale values | Existing UI order and freshness/visibility policy, simulation/replay support. New diagnostics do not change production metrics. |
| Xiaomi lock/unlock only writes, riding mode | Implemented earlier with stationary check and verification, physical lock validation pending. SHFW profile remains unsupported rather than guessed. |
| Route line ordering, contrast and completed grey path | Existing selected route above grey alternatives, completed-path split and live recording trace retained. |
| Live trip links, viewer count/privacy, route links/deep links | Existing consent-based private PeerServer links, stable viewer identities/recovery/one-minute watcher expiry; no speed/battery/telemetry shared. New spectator Activity consumes only public progress. |
| Private server configurable, outage-only cloud fallback | Existing build hostname configuration and scoped fallback warning. Permanent secret-bearing sync requires the original private server and pauses during outage. |
| PWA icons/metadata/install banner/safe-area | Existing manifest, proper icons, shortcuts, service-worker updates and settings installation flow. Final current responsive regression remains pending. |
| README/banner/icon/AltDirect/source refresh | Existing branding/native icons and content-addressed automatic source metadata updates retained; new build metadata/gallery publication is pending. |
| Conventional commits, unsigned builds and early IPA | Existing release notes parse multiple conventional clauses; signing key untouched; early unsigned IPA temporary artifact retained. No new push/build during this audit. |

## Actual validation at this checkpoint

- **230 JavaScript/TypeScript tests passed**, zero failures.
- **Lint passed without warnings; TypeScript check passed.**
- **28 Python tests passed**, including capture fallback and release metadata.
- Two isolated headless Chrome sessions passed the private pairing, automatic merge, reload recovery, mutual unpair and secret-free backup create/download/delete flow. No personal data was used.
- Earlier real Simulator baselines and 1.0.3 galleries used downloaded GitHub-built binaries, not local compilation. Native screenshot images were inspected during that work; 1.0.3 idle iPad placement remains a known failure.
- No local native compilation, SDK download, physical diagnostic scan, fresh 1.0.4 native test, push, hosting deployment or release launch has happened.

## Remaining work before claiming this update complete

1. Finish current browser visual/interaction checks for area selection, route-loading, backup import/replace and Sharing vehicle screens; stress-test merge conflicts/rename and interrupted unpair.
2. Review the final changes and persist descriptive unsigned commits after this pre-push report.
3. Only after the user's review/continuation, push and start a new GitHub build, force-cancelling an obsolete active predecessor if one exists. None is active now.
4. Use the resulting compiled app to validate idle iPad bottom-left placement and inspect every phone/tablet gallery image; no local native compilation.
5. Publish fresh validated galleries to AltSource only, phone first; consolidate binary release assets to the requested five. Historical release clutter is not yet cleaned.
6. Update hosted web/PWA to the final reviewed revision. The standard PeerServer protocol itself needs no new software protocol deployment for these client channels; verify the actual deployed host before switching.
7. Physical/native tests still required for camera, diagnostics, Android notifications, spectator Activity and background peer recovery. iOS continuous background P2P reception, free offline imagery, additional BLE protocols and SHFW profile readings are not being claimed.
