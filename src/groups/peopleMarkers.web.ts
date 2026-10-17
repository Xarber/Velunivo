import {readBadges} from '../core/riderBadges';
import {GroupMember,riderInitials} from './model';
import {VideoFeed} from './voice';
interface Marker {setLngLat(p:[number,number]):Marker;remove():void;}
/** Keep video elements alive while location/presence snapshots change. */
export class PeopleMarkers {
 private pins=new Map<string,{marker:Marker;face:HTMLDivElement;tip:HTMLDivElement;badges:HTMLDivElement;badgeKey?:string;stream?:MediaStream;photo?:string;initials?:string}>();
 constructor(private create:(element:HTMLDivElement,position:[number,number])=>Marker){}
 update(riders:GroupMember[],feeds:Record<string,VideoFeed>,enabled:boolean,accent:string,dark:boolean,onPin?:(id:string)=>void){
  const wanted=new Set<string>();
  for(const r of riders){if(!r.position)continue;wanted.add(r.id);let pin=this.pins.get(r.id);
   if(!pin){const root=document.createElement('div'),face=document.createElement('div'),tip=document.createElement('div'),badges=document.createElement('div');root.style.cssText='position:relative;width:46px;height:54px;display:flex;justify-content:center;pointer-events:none';root.append(tip,face,badges);pin={marker:this.create(root,r.position),face,tip,badges};this.pins.set(r.id,pin);}
   pin.marker.setLngLat(r.position);pin.face.title=r.name;pin.face.setAttribute('aria-label',r.name);
   pin.face.style.cssText=`position:relative;margin-top:2px;width:36px;height:36px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:${accent};border:3px solid white;outline:${r.locationPin==='halo'?4:2}px solid ${accent};border-radius:${r.locationPin==='diamond'?'12px':'50%'};color:${dark?'#102A28':'white'};font:700 12px system-ui;box-shadow:0 2px 5px #0005;pointer-events:none;opacity:${Date.now()-r.updatedAt>60000?'.45':'1'}`;
   pin.tip.style.cssText=`position:absolute;top:35px;width:14px;height:14px;transform:rotate(45deg);background:white;border:2px solid ${accent}`;
   const badges=readBadges(r.profileBadges,r.profileBadge),badgeKey=badges.join(',')+accent+dark;
   if(pin.badgeKey!==badgeKey){pin.badgeKey=badgeKey;pin.badges.replaceChildren();pin.badges.style.cssText='position:absolute;bottom:5px;right:-4px;display:flex;flex-direction:row-reverse;pointer-events:none';for(const [i,id] of badges.entries()){const badge=document.createElement('span');badge.title=id;badge.style.cssText=`width:20px;height:20px;border-radius:50%;background:${dark?'#1A2930':'white'};color:${id==='completion'||id==='level50'?'#F7C843':accent};margin-right:${i?-6:0}px;box-shadow:0 1px 3px #0006;display:grid;place-items:center;z-index:${3-i};font:700 16px system-ui`;badge.textContent=id==='completion'?'♛':id==='level50'?'★':id==='leaf'?'❧':id==='spark'?'✦':'◆';pin.badges.append(badge);}}
   const stream=enabled&&r.video&&r.camera?feeds[r.id]?.stream:undefined,photo=stream?undefined:r.photo,initials=stream||photo?undefined:riderInitials(r.name);
   pin.face.style.pointerEvents=stream&&onPin?'auto':'none';pin.face.style.cursor=stream&&onPin?'pointer':'default';pin.face.setAttribute('role',stream&&onPin?'button':'img');pin.face.tabIndex=stream&&onPin?0:-1;pin.face.onclick=stream&&onPin?event=>{event.stopPropagation();onPin(r.id);}:null;pin.face.onkeydown=stream&&onPin?event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();onPin(r.id);}}:null;
   if(pin.stream===stream&&pin.photo===photo&&pin.initials===initials)continue;
   this.detach(pin.face);pin.face.replaceChildren();pin.stream=stream;pin.photo=photo;pin.initials=initials;
   if(stream){const video=document.createElement('video');video.srcObject=stream;video.muted=true;video.autoplay=true;video.playsInline=true;video.style.cssText='width:36px;height:36px;object-fit:cover';pin.face.append(video);void video.play().catch(()=>{});}
   else if(photo){const img=document.createElement('img');img.src=photo;img.alt=r.name;img.style.cssText='width:36px;height:36px;object-fit:cover';pin.face.append(img);}else pin.face.textContent=initials??'';
  }
  for(const [id,pin] of this.pins)if(!wanted.has(id)){this.detach(pin.face);pin.marker.remove();this.pins.delete(id);}
 }
 private detach(face:HTMLDivElement){const video=face.querySelector('video');if(video){video.pause();video.srcObject=null;}}
 clear(){for(const pin of this.pins.values()){this.detach(pin.face);pin.marker.remove();}this.pins.clear();}
}
