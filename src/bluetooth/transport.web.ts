import { BLETransport } from './types';
const unavailable=async()=>{throw new Error('Vehicle Bluetooth requires the iOS or Android native build. Web remains available for GPS rides and planning.');};
export const transport:BLETransport={ready:unavailable,observeState:()=>()=>{},scan:unavailable,connect:unavailable};
