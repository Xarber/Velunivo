import {t} from '../i18n/core';
import Text from './LocalizedText';
import {BridgeSnapshot} from '../bluetooth/types';
import React from 'react';
import VehicleBatteryBadge from './VehicleBatteryBadge';
import {useBluetoothVehicle,useBluetoothPreferences} from '../bluetooth/react';
import {dashboardReading} from '../bluetooth/policy';
import {metricVisible} from '../bluetooth/preferences';
import {View} from 'react-native';
import { Route, Fix, Vehicle } from '../core/types';
import { displaySpeed, freshFix, roadSpeedLimit } from '../core/rideView';
import { usePalette } from './ui';
export default function SpeedBadges({ route, fix, index, offRoute, now, unit, profile, simulation, recorded }: { route: Route | null; fix: Fix | null; index?: number; offRoute?: boolean; now: number; unit: 'km' | 'mi'; profile: Vehicle; simulation: boolean; recorded?:BridgeSnapshot }) {
  const live=useBluetoothVehicle(profile.id),snapshot=recorded || live,{preferences}=useBluetoothPreferences();
  const reported=(!!recorded || !simulation || snapshot.simulated) && metricVisible(preferences,'speed')?dashboardReading(snapshot,profile.id,'speed',now):undefined;
  const p = usePalette(), valid = freshFix(fix, now), speed = reported && typeof reported.value==='number' ? reported.value*3.6 : valid && fix?.speed !== null && fix?.speed !== undefined ? fix.speed * 3.6 : null, limit = valid && !offRoute ? roadSpeedLimit(route, index) : null;
  const number = (v: number | null) => v === null ? '—' : displaySpeed(v, unit).toFixed(0), u = unit === 'mi' ? 'mph' : 'km/h';
  const exceeded = speed !== null && speed > Math.min(profile.maxSpeed, profile.ridingLimit, limit ?? Infinity) + 1;
  return <View pointerEvents="none" style={{ gap: 12, alignItems: 'center', width: 84 }}><View accessibilityLabel={t(`${simulation || reported?.source==='simulator' ? 'Demo speed' : 'Current speed'} ${number(speed)} ${u}`)} style={{ borderRadius: 18, backgroundColor: p.card, padding: 10, minWidth: 80, alignItems: 'center', boxShadow: '0 3px 12px #00000030' }}><Text style={{ color: exceeded ? '#E97C65' : p.text, fontWeight: '800', fontSize: 30 }}>{number(speed)}</Text><Text style={{ color: p.muted, fontSize: 10 }}>{simulation || reported?.source==='simulator' ? recorded?'Replay · ':'Demo · ' : reported?'Vehicle · ':''}{u}</Text>{!reported&&fix?.speedSource==='estimated'&&<Text style={{color:'#E5B84B',fontSize:10,textAlign:'center'}}>Estimated · may be inaccurate</Text>}</View><View accessibilityLabel={t(`Mapped road speed limit ${limit === null ? 'unknown' : number(limit) + ' ' + u}`)} style={{ width: 58, height: 58, borderRadius: 30, borderWidth: 5, borderColor: '#D85847', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px #00000025' }}><Text style={{ fontSize: 24, fontWeight: '800', color: '#162C35' }}>{number(limit)}</Text></View><Text style={{ backgroundColor: p.card, color: p.muted, padding: 5, borderRadius: 8, fontSize: 10 }}>{limit === null ? 'Limit unknown' : `Road · ${u}`}</Text>{(!!recorded || !simulation || snapshot.simulated) && <VehicleBatteryBadge vehicleId={profile.id} now={now} snapshot={recorded} />}</View>;
}
