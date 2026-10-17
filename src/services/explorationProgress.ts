import AsyncStorage from '@react-native-async-storage/async-storage';
import {emptyExplorationProgress,parseExplorationProgress,mergeExplorationProgress,ExplorationProgress} from '../core/explorationProgress';
export async function readExplorationProgress(){try{return parseExplorationProgress(JSON.parse(await AsyncStorage.getItem('exploration-progress-v1')||'null'));}catch{return emptyExplorationProgress();}}
let pending=Promise.resolve();
export function persistExplorationProgress(value:ExplorationProgress){pending=pending.catch(()=>{}).then(async()=>{const current=await readExplorationProgress();await AsyncStorage.setItem('exploration-progress-v1',JSON.stringify(mergeExplorationProgress(current,value)));for(const listener of listeners)listener();});return pending;}

const listeners=new Set<()=>void>();
export function subscribeExplorationProgress(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
