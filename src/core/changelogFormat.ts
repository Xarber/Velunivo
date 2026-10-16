/** Historical versions stay unchanged; only their overview is curated. Everything stays in full details. */
export const featureTitles:Record<string,readonly string[]>={
 '2.5.0':['Memories together','Make every map yours','Devices that stay connected'],
 '2.3.0':['Vehicle performance','Launch logs','Find settings faster'],
 '2.2.0':['Explore a new way home','Battery estimates that learn','Transit on your map'],
 '2.1.0':['Ride with confidence','Explore and level up','Stay together'],
 '2.0.0':['Explore your world','Your riding profile','Vehicle care'],
 '1.2.0':['Pinned camera preview','Group riders'],
 '1.0.20':['Recording trip'],'1.0.16':['Recording trip'],'1.0.9':['Native peer connections'],
 '1.0.8':['Ride together','Talk as you ride'],'1.0.7':['Arrive and relax','Range learned from real rides'],
 '1.0.5':['Android Live Updates'],'1.0.4':['Choose your offline area','Keep your devices together'],
 '1.0.0':['A smarter ride planner','Better energy estimates','Your devices, connected'],
 '0.1.31':['A friendly start','Your data, on both devices'],'0.1.29':['Replay your rides','English and Italian'],
 '0.1.26':['Bluetooth in supported browsers'],'0.1.24':['Share a live trip','Share a route'],
 '0.1.23':['Connect a personal vehicle','Real battery readings'],'0.1.22':['Learn battery consumption'],
 '0.1.20':['Record without a destination'],'0.1.14':['Directions in the background','Install the web app'],
 '0.1.13':['Places and better estimates','Lock Screen guidance and downloads'],'0.1.12':['Keep your ride history'],
 '0.1.8':['Native glass tabs'],'0.1.5':['Glass and motion'],'0.1.3':['Connected route planning'],
 '0.1.2':['Your own garage','Follow the road ahead'],'0.1.1':['A full-screen map','Choose when to ride'],
 '0.1.0':['Your first ride','Plan your journey'],
};
export function curateRelease<T extends {icon:string;title:string;text:string}>(release:{version:string;items:readonly T[]}):{version:string;items:T[]}{const features=release.items.filter(item=>featureTitles[release.version]?.includes(item.title)),items=features.slice(0,3);if(items.length<3&&release.items.some(item=>!features.includes(item)))items.push({icon:'construct-outline',title:'Fixes & Improvements',text:release.version==='1.2.1'?'Clearer speed readings, scooter reconnection and developer tools.':'Smaller refinements and reliability fixes.'} as T);return {version:release.version,items};}
