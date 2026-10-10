import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const marker='// VELUNIVO_NATIVE_ACTIVITY_V1';
function once(source,needle,replacement) {
 if(source.split(needle).length!==2)throw new Error('Expo Widgets source changed; review native activity patch.');
 return source.replace(needle,replacement);
}
export function patchSources(widget,utils,views) {
 widget=once(widget,'    if let node = nodes[sectionName] as? [String: Any] {','    if nodes["__velunivo_native"] as? Bool == true {\n      VelunivoActivitySection(props: context.state.props, sectionName: sectionName)\n    } else if let node = nodes[sectionName] as? [String: Any] {');
 widget=once(widget,'    if #available(iOS 18.0, *) {','    if nodes["__velunivo_native"] as? Bool == true {\n      VelunivoActivityBanner(context: context)\n    } else if #available(iOS 18.0, *) {');
 utils=once(utils,'  let layout = WidgetsStorage.getString(forKey: "__expo_widgets_live_activity_\\(name)_layout") ?? ""',`${marker}\n  if name == "VelunivoNavigation" || name == "VelunivoNavigationTest" {\n    return ["__velunivo_native": true]\n  }\n  let layout = WidgetsStorage.getString(forKey: "__expo_widgets_live_activity_\\(name)_layout") ?? ""`);
 return {widget:widget+`\n${marker}\n`+views,utils};
}
export function applyPatch(directory=root) {
 const folder=path.join(directory,'node_modules/expo-widgets');
 const version=JSON.parse(fs.readFileSync(path.join(folder,'package.json'),'utf8')).version;
 if(version!=='57.0.23')throw new Error(`Review native activity patch for Expo Widgets ${version}`);
 const widgetPath=path.join(folder,'ios/Widgets/WidgetLiveActivity.swift'),utilsPath=path.join(folder,'ios/Widgets/Utils.swift');
 const views=fs.readFileSync(path.join(directory,'native/VelunivoActivityViews.swift'),'utf8');
 let widget=fs.readFileSync(widgetPath,'utf8'),utils=fs.readFileSync(utilsPath,'utf8');
 if(widget.includes(marker)&&utils.includes(marker)) {
  // Refresh checked-in views on repeated installation without duplicating helpers.
  widget=widget.split(`\n${marker}\n`)[0]+`\n${marker}\n`+views;
  fs.writeFileSync(widgetPath,widget);return;
 }
 const hashes=[['eb094a8dabfc256d5aaa3c85f31dc26f18264250992acd417da65aa811bd02f6',widget],['cca8d5a8d80fa9a21d863876f62c6c134fcb9d1155c04a00728479ff34776850',utils]];
 for(const [expected,source] of hashes)if(crypto.createHash('sha256').update(source).digest('hex')!==expected)throw new Error('Expo Widgets source hash changed; review native activity patch.');
 ({widget,utils}=patchSources(widget,utils,views));
 fs.writeFileSync(widgetPath,widget);fs.writeFileSync(utilsPath,utils);
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))applyPatch();
