/** A transient failure keeps the user's consent and trip code; only explicit close revokes it. */
export class RecoveryScheduler {
 private timer?:ReturnType<typeof setTimeout>;private attempt=0;private stopped=false;
 constructor(private retry:()=>void){}
 request(){if(this.stopped || this.timer)return;this.timer=setTimeout(()=>{this.timer=undefined;if(!this.stopped)this.retry();},Math.min(30000,1000*2**Math.min(this.attempt++,5)));}
 ready(){this.attempt=0;this.cancel();}
 cancel(){if(this.timer)clearTimeout(this.timer);this.timer=undefined;}
 resume(){if(this.stopped)return;this.cancel();this.retry();}
 stop(){this.stopped=true;this.cancel();}
}
