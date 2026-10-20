# App plugins (API 1)

Plugins extend Velunivo without rebuilding the native application. They are separate from Bluetooth protocol plugins, which remain compiled integrations. App plugins cannot change vehicle firmware, issue Bluetooth writes, read pairing credentials, or access sync/API secrets.

## Install and discover

Open Developer Options and enable **Show plugins menu** to explore the bundled, disabled examples. Those examples do not reveal the menu automatically. Installing an external package makes Settings → Plugins visible, including while that plugin is disabled.

Enter an HTTPS JSON URL, a GitHub `blob` URL, or `owner/repository` (resolves `main/velunivo.plugin.json`). Download previews identity, description and permissions. Install stores a local copy, disabled. Enable it to run; enabled packages are automatically discovered at startup. Updating requires downloading and installing the replacement; it disables the package again. Downloads never silently update executable code. GitHub raw URLs work on web; other download hosts must allow cross-origin requests. There is no plugin catalog or mandatory Velunivo server.

Each installation stores its source, SHA-256 digest and timestamp. Up to 30 packages may be installed, eight enabled. Removing a package removes its private storage. File/device backups deliberately do not transfer executable plugins; install them explicitly on each device.

## Package

```json
{
  "schema": 1,
  "api": 1,
  "id": "yourname.route-card",
  "name": "My route card",
  "version": "1.0.0",
  "description": "A compact route summary.",
  "permissions": ["app.read", "ui.cards"],
  "code": "const s = await api.app.read(); await api.ui.card({id:'summary',slot:'home',title:'My route',text:s.route ? Math.round(s.route.meters)+' m' : 'Choose a destination'});"
}
```

The code is the body of an async function receiving `api`. No import, bundler or Node dependencies are required. Use `await` for API calls, including UI registration, and handle errors in event handlers. Package names/versions are validated, executable code is limited to 200,000 characters, and downloads to 512 KB with a 15-second timeout. UI messages have length/count bounds.

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

`examples/plugins/` contains downloadable packages identical to the disabled bundled examples:

- `ride-card.json`: route summary card.
- `telemetry.json`: capability-aware electrical widget.
- `accent.json`: ocean accent.
- `map-action.json`: transit toggle action.
- `storage.json`: interactive persistent counter.

To add more built-in packages, register them in `src/plugins/examples.ts`. Frontend extension contracts live in `model.ts`; permissions are enforced in `PluginProvider.tsx`. Extend those together when incrementing API compatibility. Packages cannot register new native modules or Bluetooth protocols at runtime.
