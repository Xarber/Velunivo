/** Versioned, declarative extensions. Packages never run in the React Native VM. */
export const pluginPermissions=['app.read','vehicle.telemetry','ui.cards','appearance.accent','storage','actions.map'] as const;
export type PluginPermission=typeof pluginPermissions[number];
export type PluginPackage={schema:1;api:1;id:string;name:string;version:string;description:string;permissions:PluginPermission[];code:string;icon?:string};
export type InstalledPlugin={package:PluginPackage;enabled:boolean;bundled:boolean;source:string;digest:string;installedAt:number};
export type PluginCard={id:string;slot:'home'|'ride'|'plugins';title:string;text:string;action?:{id:string;label:string}};
export type PluginAccent={light:string;dark:string};
export function parsePlugin(value:unknown):PluginPackage {
 if(!value||typeof value!=='object')throw new Error('Invalid plugin package.');
 const p=value as Record<string,unknown>;
 if(p.schema!==1||p.api!==1)throw new Error('This plugin needs a different app API version.');
 if(typeof p.id!=='string'||!/^[a-z][a-z0-9.-]{2,79}$/.test(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>80||typeof p.version!=='string'||!/^\d+\.\d+\.\d+$/.test(p.version))throw new Error('Invalid plugin identity.');
 if(typeof p.description!=='string'||p.description.length>500||typeof p.code!=='string'||!p.code.trim()||p.code.length>220000)throw new Error('Invalid plugin code or description.');
 if(!Array.isArray(p.permissions)||p.permissions.some(v=>!pluginPermissions.includes(v)))throw new Error('Unsupported plugin permission.');
 return {schema:1,api:1,id:p.id,name:p.name.trim(),version:p.version,description:p.description,permissions:[...new Set(p.permissions)] as PluginPermission[],code:p.code,...(typeof p.icon==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/=]{1,88000}$/.test(p.icon)?{icon:p.icon}:{})};
}
export function pluginCard(value:unknown):PluginCard {
 const p=value as Partial<PluginCard>|null;
 if(!p||typeof p.id!=='string'||!/^[a-z0-9-]{1,40}$/.test(p.id)||!['home','ride','plugins'].includes(p.slot??'')||typeof p.title!=='string'||p.title.length>100||typeof p.text!=='string'||p.text.length>600)throw new Error('Invalid plugin card.');
 if(p.action&&(typeof p.action.id!=='string'||p.action.id.length>40||typeof p.action.label!=='string'||p.action.label.length>80))throw new Error('Invalid plugin action.');
 return {id:p.id,slot:p.slot!,title:p.title,text:p.text,...(p.action?{action:{id:p.action.id,label:p.action.label}}:{})};
}
export function pluginAccent(value:unknown):PluginAccent {
 const p=value as Partial<PluginAccent>|null;
 if(!p||typeof p.light!=='string'||typeof p.dark!=='string'||![p.light,p.dark].every(c=>/^#[0-9a-f]{6}$/i.test(c)))throw new Error('Invalid plugin accent.');
 return {light:p.light,dark:p.dark};
}
export function packageUrl(input:string) {
 let value=input.trim();if(/^[\w.-]+\/[\w.-]+$/.test(value))value=`https://raw.githubusercontent.com/${value}/main/velunivo.vpi`;
 const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use an HTTPS plugin package URL.');
 if(url.hostname==='github.com'){const bits=url.pathname.split('/');if(bits[3]==='blob'){url.hostname='raw.githubusercontent.com';bits.splice(3,1);url.pathname=bits.join('/');}}
 url.hash='';return url.toString();
}
export const permitted=(p:PluginPackage,permission:PluginPermission)=>p.permissions.includes(permission);
