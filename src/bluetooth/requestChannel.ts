/** Match a response before sending, but count reply time only after the native write finishes. */
export class VehicleRequestChannel {
 private pending?:{match:(body:Uint8Array)=>boolean;resolve:(body:Uint8Array)=>void;reject:(error:Error)=>void;timer?:ReturnType<typeof setTimeout>};private closed=false;
 constructor(private write:(wire:Uint8Array)=>Promise<void>){}
 receive(body:Uint8Array){const waiter=this.pending;if(waiter?.match(body)){this.pending=undefined;clearTimeout(waiter.timer);waiter.resolve(body);}}
 cancel(error:Error){const waiter=this.pending;this.pending=undefined;if(waiter){clearTimeout(waiter.timer);waiter.reject(error);}}
 close(){this.closed=true;this.cancel(new Error('Bluetooth session closed'));}
 send(wire:Uint8Array,match:(body:Uint8Array)=>boolean,timeout=1800){return new Promise<Uint8Array>((resolve,reject)=>{if(this.closed){reject(new Error('Bluetooth session closed'));return;}if(this.pending){reject(new Error('Vehicle request already pending'));return;}const waiter={match,resolve,reject,timer:undefined as ReturnType<typeof setTimeout>|undefined};this.pending=waiter;void this.write(wire).then(()=>{if(this.pending!==waiter)return;waiter.timer=setTimeout(()=>{if(this.pending===waiter)this.cancel(new Error('Vehicle did not respond'));},timeout);}).catch(error=>{if(this.pending===waiter)this.cancel(error instanceof Error?error:new Error('Bluetooth write failed'));});});}
}
