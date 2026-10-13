/** Muting releases capture, even when a permission request is still pending. */
export class Microphone<S extends {getTracks():{stop():void}[];release?(tracks:boolean):void}> {
 stream?:S;private generation=0;private closed=false;private publishing:Promise<void>=Promise.resolve();
 private dispose(stream:S){stream.getTracks().forEach(t=>t.stop());stream.release?.(true);}
 // Serialize sender replacement so a slow unmute cannot reattach after mute.
 private send(stream:S|null,token:number){const task=this.publishing.catch(()=>{}).then(()=>{if(stream&&(this.closed||token!==this.generation))return;return this.publish(stream);});this.publishing=task;return task;}
 constructor(private capture:()=>Promise<S>,private publish:(stream:S|null)=>Promise<void>){}
 async unmute(){if(this.closed)return;if(this.stream){await this.send(this.stream,this.generation);return;}const token=++this.generation;const fresh=await this.capture();if(this.closed||token!==this.generation){this.dispose(fresh);return;}if(this.stream)this.dispose(this.stream);this.stream=fresh;try{await this.send(fresh,token);}catch(e){if(this.stream===fresh){this.dispose(fresh);this.stream=undefined;}throw e;}}
 async mute(){const token=++this.generation;if(this.stream)this.dispose(this.stream);this.stream=undefined;await this.send(null,token);}
 stop(){this.closed=true;const token=++this.generation;if(this.stream)this.dispose(this.stream);this.stream=undefined;void this.send(null,token).catch(()=>{});}
}
