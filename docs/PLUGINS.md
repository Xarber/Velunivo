# App plugins (API 1)

Plugins extend Velunivo without rebuilding the native application. They are separate from Bluetooth protocol plugins, which remain compiled integrations. App plugins cannot change vehicle firmware, issue Bluetooth writes, read pairing credentials, or access sync/API secrets.

## Install and discover

Open Developer Options and enable **Show plugins menu** to explore the bundled, disabled examples. Those examples do not reveal the menu automatically. Installing an external package makes Settings → Plugins visible, including while that plugin is disabled.

Use **Import plugin file** for a `.vpi` or `.zip`, or enter an HTTPS archive URL, GitHub `blob` URL, or `owner/repository` (resolves `main/velunivo.vpi`). `.vpi` is simply a renamed ZIP; both extensions have identical behavior. Preview the icon, identity, description and permissions, then install disabled and explicitly enable. Downloading or inspecting an archive never executes it. Enabled packages load automatically at startup; replacements are disabled again for review. Other hosts must permit web cross-origin downloads.

Try `https://raw.githubusercontent.com/Xarber/Velunivo/development/examples/plugins/installable-demo.vpi`. Bundled example IDs are reserved. Existing installed legacy packages remain compatible; new installs use archives rather than executable JSON manifests.

Each installation stores its source, SHA-256 digest and timestamp. Up to 30 packages may be installed, eight enabled. Removing a package removes its private storage. File/device backups deliberately do not transfer executable plugins; install them explicitly on each device.

## Create a plugin

Keep `info.json` at the ZIP root (do not ZIP the containing folder):

```text
my-plugin/
  info.json
  src/main.js
  lib/format.js       # optional local pure-JavaScript libraries
  assets/icon.png     # optional PNG, up to 512×512 and 64 KB
  LICENSE            # include dependency licenses
```

`info.json` contains metadata only, never source code:

```json
{
  "schema": 1,
  "api": 1,
  "id": "yourname.route-card",
  "name": "My route card",
  "version": "1.0.0",
  "description": "A compact route summary.",
  "permissions": ["app.read", "ui.cards"],
  "entry": "src/main.js",
  "icon": "assets/icon.png"
}
```

`src/main.js` is an async function body with `api` and a local CommonJS `require`:

```js
const {meters} = require('../lib/format');
async function refresh() {
  const state = await api.app.read();
  await api.ui.card({id:'summary', slot:'home', title:'My route',
    text:state.route ? meters(state.route.meters) : 'Choose a destination'});
}
await refresh();
api.on('context', refresh);
```

`lib/format.js`:

```js
exports.meters = value => Math.round(value) + ' m';
```

Package and validate from this repository:

```sh
node --import tsx scripts/package-plugin.mjs path/to/my-plugin my-plugin.vpi
```

Or create a regular ZIP containing the root files and rename it to `.vpi`. Download/import limits: 512 KB compressed, 1 MB expanded, 64 entries, 200 KB source/data modules and 220 KB compiled source. Only `.js`, `.json`, `.png`, `.md`, `.txt` and license files are accepted; unsafe paths and duplicates are rejected. Nothing is extracted to the app filesystem. Icons are local PNGs; remote icons, SVG, executable binaries and nested archives are not accepted.

Local libraries use `module.exports`/`exports`, relative `require('./file')`, JSON data modules and `index.js`. Runtime npm installation, native modules and remote imports are unsupported. For npm libraries, bundle browser/Worker-compatible code ahead of time (for example esbuild with `--bundle --platform=browser --format=cjs`) and include licenses. Libraries remain in the same isolated Worker as the plugin, with no additional permissions. Do not bundle React Native, Node APIs or libraries needing DOM/network access. `await` at entry is supported; synchronous required libraries must not use top-level await.

## API and extension points

| Permission | API | Behavior |
| --- | --- | --- |
| `app.read` | `await api.app.read()` | `{version, vehicle:{kind}, route:{name,meters} \| null, rideActive}`. No GPS coordinates, rider identity, secrets or full route. |
| `vehicle.telemetry` | `await api.vehicle.telemetry()` | Fresh numeric readings for the selected vehicle: batteryPercent (%), voltage (V), current (A), power (W), batteryTemperature (°C), speed (m/s). Unsupported/stale readings are omitted. Read-only, no connection is initiated. |
| `ui.cards` | `await api.ui.card({id,slot,title,text,action?})` | Native app-styled card. Slots: `home` in expanded planning controls, `ride` in expanded navigation/recording controls, `plugins` in Plugins. Up to 12 cards, replaced by ID. Optional action `{id,label}`. |
| `appearance.accent` | `await api.appearance.accent({light:'#1767A6',dark:'#80C9FF'})` | Global palette override while enabled; disabling restores the selected built-in theme. First enabled accent wins. Does not replace the installed home-screen icon. |
| `storage` | `await api.storage.get(key)` / `await api.storage.set(key,value)` | Private JSON namespace per package, 64 KB total. Keys limited to letters/numbers/underscore/dot/hyphen. No access to other app/plugin storage. |
| `actions.map` | `await api.map.toggleTransit()` | Toggles the existing transit-overlay preference. No ride starts, uploads, navigation or vehicle writes. |

`api.on('action', async id => { ... })` receives a click on that package's card. `api.on('context', async () => { ... })` refreshes when the route/activity context changes; telemetry plugins also refresh every three seconds. Re-registering a handler replaces the previous handler. API calls are checked against the installed manifest on the app side, not just inside plugin code.

## Isolation and lifecycle

Downloaded JavaScript executes in a Worker: inside a sandboxed iframe on web, inside a dedicated WKWebView/Android WebView on native. It never executes in Hermes or receives React/Node/native modules. CSP blocks direct network access and remote imports. No arbitrary HTML or native component rendering is accepted. Messages are bound to the runtime, bounded and rate-limited. Unresponsive or failed runtimes are removed for the session; toggle the package off and on to retry. Disabling/uninstalling terminates its worker and removes cards/colors immediately. Workers do not provide a native background execution entitlement and may pause when backgrounded.

Only install code you trust. A granted read permission allows the package to process that data within this session, and map actions can change the permitted display preference. This isolation is not a guarantee against browser/OS vulnerabilities.

## Examples

`examples/plugins/` contains source folders and matching downloadable `.vpi` packages for route cards, telemetry, accent colors, a transit action and private storage. `installable-demo/` demonstrates a separate local library and icon using a non-reserved ID.

Bundled examples remain registered in `src/plugins/examples.ts`, disabled by default. Permissions are enforced by `PluginProvider.tsx`; archive validation and local module compilation are in `archive.ts`. Packages cannot register new native modules or Bluetooth protocols at runtime.
