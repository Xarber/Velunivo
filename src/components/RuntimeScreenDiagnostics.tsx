import {useEffect} from 'react';
import {useWindowDimensions} from 'react-native';
import {usePathname} from 'expo-router';
import {diagnostic} from '../core/diagnosticEvents';
/** Paths exclude URL queries (pairing codes/share pins); no user locations are recorded. */
export default function RuntimeScreenDiagnostics(){const path=usePathname(),{width,height,fontScale}=useWindowDimensions();useEffect(()=>{diagnostic('ui','screen',{path,width,height,fontScale,orientation:width>height?'landscape':'portrait'});},[path,width,height,fontScale]);return null;}
