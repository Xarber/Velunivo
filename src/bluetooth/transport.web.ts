import {WebBLETransport,webBluetoothAvailable} from './webTransport';
export const transport=new WebBLETransport();
export const bluetoothAvailable=webBluetoothAvailable;
