import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { ActivityChecks } from '../core/activityDiagnostics';
const native=Platform.OS==='ios' ? requireOptionalNativeModule<{inspect():ActivityChecks}>('VelunivoActivityDiagnostics') : null;
export function inspectActivityInstallation():ActivityChecks|null {return native?.inspect() ?? null;}
