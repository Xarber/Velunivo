/** Muting releases capture, even when a permission request is still pending. */
export class Microphone<S extends {getTracks():{stop():void}[]}> {
 stream?:S;private generation=0;private closed=false;
 constructor(private capture:()=>Promise<S>,private publish:(stream:S|null)=>Promise<void>){}
 async unmute(){if(this.closed)return;const token=++this.generation;const fresh=await this.capture();if(this.closed||token!==this.generation){fresh.getTracks().forEach(t=>t.stop());return;}this.stream?.getTracks().forEach(t=>t.stop());this.stream=fresh;try{await this.publish(fresh);}catch(e){fresh.getTracks().forEach(t=>t.stop());if(this.stream===fresh)this.stream=undefined;throw e;}}
 async mute(){this.generation++;this.stream?.getTracks().forEach(t=>t.stop());this.stream=undefined;await this.publish(null);}
 stop(){this.closed=true;this.generation++;this.stream?.getTracks().forEach(t=>t.stop());this.stream=undefined;}
}
