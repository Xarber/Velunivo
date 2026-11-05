// SPDX-License-Identifier: AGPL-3.0-only
import {WebBLETransport} from '../../src/bluetooth/webTransport';
import {authenticateMi, MI, MiUART} from '../../src/bluetooth/plugins/miAuth';
import {NUS} from '../../src/bluetooth/plugins/m365Packets';
import {VehicleApprovalRequiredError} from '../../src/bluetooth/approvalRetry';
import type {BLELink} from '../../src/bluetooth/types';
import {inspectMiSession, inspectionReads, InspectionResult} from './protocol';

const transport = new WebBLETransport();
const credentials = new Map<string, Record<string, string>>(); // Memory only; never exported, logged or uploaded.
const button = (id: string) => document.getElementById(id) as HTMLButtonElement;
const connect = button('connect'), read = button('read'), disconnect = button('disconnect'), download = button('download');
const status = document.getElementById('status')!;
const output = document.getElementById('output')!;
const consent = document.getElementById('registration') as HTMLInputElement;
let link: BLELink | undefined, uart: MiUART | undefined, abort: AbortController | undefined;
let result: InspectionResult | undefined;
let generation = 0;
const message = (text: string) => {status.textContent = text;};
const failure = (error: unknown) => message(error instanceof VehicleApprovalRequiredError
  ? 'Physical approval needed. Toggle the headlight once while disconnected, then immediately use Connect scooter and select it again. This probe does not reconnect automatically.'
  : error instanceof Error ? error.message : 'Inspection failed');
async function close() {
  generation++;
  abort?.abort(); uart = undefined;
  const old = link; link = undefined;
  read.disabled = true; disconnect.disabled = true;
  await old?.disconnect(); connect.disabled = false;
}
connect.onclick = () => {
  if (!consent.checked) {message('Review and acknowledge the pairing notice first.'); return;}
  const attempt = ++generation;
  // Browser picker must start synchronously inside the click handler.
  // Same documented Xiaomi-family advertisement signatures as the production plugin.
  // UART may be absent from the advertisement even when the GATT service exists.
  const filters = [0x20, 0x22, 0x25, 0x28, 0x29, 0x2b].flatMap(model => [
    {companyIdentifier: 0x424e, dataPrefix: [model]}, {companyIdentifier: 0x434e, dataPrefix: [0, model]},
  ]);
  const chosen = transport.chooseDevice([NUS, MI], filters);
  connect.disabled = true; download.disabled = true; result = undefined; output.textContent = '';
  void (async () => {
    try {
      const device = await chosen;
      const controller = new AbortController(); abort = controller; disconnect.disabled = false;
      message('Connecting to selected scooter…');
      const connected = await transport.connect(device);
      if (controller.signal.aborted || attempt !== generation) {await connected.disconnect(); return;}
      link = connected;
      link.onDisconnect(() => {if (link !== connected) return; controller.abort(); uart = undefined; link = undefined; read.disabled = true; connect.disabled = false; disconnect.disabled = true; message('Disconnected.');});
      const saved = credentials.get(device.id) ?? {};
      credentials.set(device.id, saved);
      const authenticated = await authenticateMi(link, {credentials: saved, signal: controller.signal, emit() {}, phase: message,
        random: length => crypto.getRandomValues(new Uint8Array(length))});
      if (attempt !== generation || controller.signal.aborted) return;
      uart = authenticated;
      read.disabled = false;
      message('Authenticated. Ready for allowlisted read-only inspection.');
    } catch (error) {if (attempt !== generation) return; await close(); failure(error);}
  })();
};
read.onclick = () => {
  if (!link || !uart || !abort) return;
  const currentLink = link, currentUART = uart, signal = abort.signal;
  const attempt = generation;
  read.disabled = true; download.disabled = true; result = undefined;
  message('Reading stationary telemetry and research blocks…');
  void inspectMiSession(currentLink, currentUART, signal).then(snapshot => {
    if (attempt !== generation || signal.aborted) return;
    result = snapshot; output.textContent = JSON.stringify(snapshot, null, 2);
    download.disabled = false;
    message(`Read complete: ${Object.keys(snapshot.blocks).length}/${Object.keys(inspectionReads).length} blocks. Raw responses are not verified settings or a restorable backup.`);
  }).catch(error => {if (attempt === generation) failure(error);}).finally(() => {if (attempt === generation) read.disabled = !uart;});
};
disconnect.onclick = () => {void close().then(() => message('Disconnected. Pairing token remains in memory until this tab closes.'));};
download.onclick = () => {
  if (!result) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], {type: 'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = `velunivo-readonly-${Date.now()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
window.addEventListener('pagehide', () => {void close(); credentials.clear();});
