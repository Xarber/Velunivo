import {useEffect,useState} from 'react';
import {emptyExplorationProgress} from '../core/explorationProgress';
import {readExplorationProgress,subscribeExplorationProgress} from './explorationProgress';
import {subscribeDataChange} from './dataChange';
export function useExplorerAwards(){const [progress,setProgress]=useState(emptyExplorationProgress);useEffect(()=>{let alive=true;const read=()=>void readExplorationProgress().then(p=>{if(alive)setProgress(p);});read();const off=subscribeExplorationProgress(read),changed=subscribeDataChange(read);return()=>{alive=false;off();changed();};},[]);return progress;}
