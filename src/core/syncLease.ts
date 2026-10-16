/** One large archive exchange per device keeps five-device meshes bounded in memory. */
export class SyncLease {private owner='';private until=0;acquire(id:string,now=Date.now()){if(this.owner&&this.owner!==id&&now<this.until)return false;this.owner=id;this.until=now+180000;return true;}release(id:string){if(this.owner===id){this.owner='';this.until=0;}}}
