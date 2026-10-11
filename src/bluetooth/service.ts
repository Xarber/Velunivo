import * as Crypto from 'expo-crypto';
import { BluetoothVehicleBridge } from './bridge';
import { PluginRegistry } from './registry';
import { XiaomiM365Plugin } from './plugins/XiaomiM365Plugin';
import { SimulatorPlugin } from './plugins/SimulatorPlugin';
import { transport } from './transport';
import { associationStorage } from './persistence';
export const registry=new PluginRegistry().register(XiaomiM365Plugin).register(SimulatorPlugin);
export const bluetoothBridge=new BluetoothVehicleBridge(registry,transport,associationStorage,n=>Crypto.getRandomBytes(n));
