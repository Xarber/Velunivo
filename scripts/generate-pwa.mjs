import fs from 'node:fs/promises';
import sharp from 'sharp';
const out='public/pwa';await fs.mkdir(out,{recursive:true});
for(const size of [192,512])await sharp('assets/icon.png').resize(size,size).png().toFile(`${out}/icon-${size}.png`);
await sharp('assets/icon.png').resize(512,512).png().toFile(`${out}/maskable-512.png`);
await sharp('assets/icon.png').resize(180,180).png().toFile(`${out}/apple-touch-icon.png`);
await sharp('assets/android-icon-monochrome.svg').resize(512,512).png().toFile(`${out}/monochrome-512.png`);
await fs.copyFile('docs/brand/social-preview.png',`${out}/social-preview.png`);
const screenshots=[];
for(const [source,name,form_factor,label] of [['docs/screenshots/navigation-web-phone.jpg','phone.jpg','narrow','Phone web navigation preview · simulated ride'],['docs/screenshots/navigation-web-desktop.jpg','wide.jpg','wide','Desktop web navigation preview · simulated ride']]){await fs.copyFile(source,`${out}/${name}`);const {width,height}=await sharp(source).metadata();screenshots.push({src:`/pwa/${name}`,sizes:`${width}x${height}`,type:'image/jpeg',form_factor,label});}
const icons=[192,512].map(size=>({src:`/pwa/icon-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any'}));icons.push({src:'/pwa/maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'},{src:'/pwa/monochrome-512.png',sizes:'512x512',type:'image/png',purpose:'monochrome'});
const manifest={id:'/',name:'Velunivo — Scooter & E-bike Navigation',short_name:'Velunivo',description:'Plan e-scooter and e-bike rides, compare bicycle and car-road alternatives with vehicle-specific ETA, save places and routes, and keep ride records locally. Web guidance requires keeping the app open.',lang:'en',dir:'ltr',start_url:'/?source=pwa',scope:'/',display:'standalone',display_override:['standalone','minimal-ui'],orientation:'any',theme_color:'#007F6D',background_color:'#102C2B',categories:['navigation','travel','utilities'],prefer_related_applications:false,launch_handler:{client_mode:'focus-existing'},icons,screenshots,shortcuts:[['Plan a ride','Explore','/','Compare routes for your vehicle'],['Library','Library','/offline','Saved places, routes and recorded rides'],['Vehicles','Vehicles','/scooter','Manage your e-scooters and e-bikes'],['Settings','Settings','/settings','Units, maps and ride preferences']].map(([name,short_name,url,description])=>({name,short_name,url,description,icons:[icons[0]]}))};
await fs.writeFile('public/manifest.webmanifest',JSON.stringify(manifest,null,2)+'\n');
