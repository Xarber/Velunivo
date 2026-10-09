import React from 'react';
import { Text, View } from 'react-native';
import { Vehicle, Fix, Route } from '../core/types';
import { arrivalTime, displaySpeed, distanceLeft, freshFix, roadSpeedLimit } from '../core/rideView';
import { minutes } from '../core/eta';
import { usePalette } from './ui';
export default function RideDashboard({ profile, route, fix, index, offRoute, seconds, meters, now, unit, compact = false, simulation = false }: { profile: Vehicle; route: Route | null; fix: Fix | null; index?: number; offRoute?: boolean; seconds?: number; meters?: number; now: number; unit: 'km' | 'mi'; compact?: boolean; simulation?: boolean }) {
  const p = usePalette(), valid = freshFix(fix, now);
  const speed = valid && fix?.speed !== null && fix?.speed !== undefined ? fix.speed * 3.6 : null;
  const roadLimit = valid && !offRoute ? roadSpeedLimit(route, index) : null, cap = Math.min(profile.maxSpeed, profile.ridingLimit);
  const exceeded = speed !== null && speed > Math.min(cap, roadLimit ?? Infinity) + 1;
  const number = (n: number | null) => n === null ? '—' : displaySpeed(n, unit).toFixed(0), speedUnit = unit === 'mi' ? 'mph' : 'km/h';
  const metric = (label: string, value: string, color = p.text) => <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={label === 'Arrival' ? 2 : 1} adjustsFontSizeToFit style={{ fontSize: compact || label === 'Arrival' ? 20 : 24, fontWeight: '800', color }}>{value}</Text><Text style={{ color: p.muted, fontSize: 11 }}>{label}</Text></View>;
  return <View style={{ gap: compact ? 6 : 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{metric(`${simulation ? 'Demo speed' : 'Speed'} · ${speedUnit}`, number(speed), exceeded ? '#E97C64' : p.text)}<View style={{ flex: 1, alignItems: 'center' }}><View accessibilityLabel={`Mapped road speed limit ${roadLimit === null ? 'unknown' : number(roadLimit) + ' ' + speedUnit}`} style={{ borderRadius: 25, width: 48, height: 48, borderWidth: 4, borderColor: '#D85847', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 21, color: '#162C35', fontWeight: '800' }}>{number(roadLimit)}</Text></View><Text style={{ color: p.muted, fontSize: 10 }}>Road limit · {speedUnit}</Text></View>{metric(`Your cap · ${speedUnit}`, number(cap))}</View>
    <View style={{ flexDirection: 'row', gap: 10 }}>{metric('Arrival', seconds === undefined ? '—' : arrivalTime(seconds, now))}{metric('Time left', seconds === undefined ? '—' : minutes(seconds))}{metric('Distance left', meters === undefined ? '—' : distanceLeft(meters, unit))}</View>
    {!compact && <Text style={{ color: exceeded ? '#E97C64' : p.muted, fontSize: 11 }}>{exceeded ? 'Above your configured or mapped speed limit. ' : ''}{roadLimit === null ? 'Road limit unknown · check local signs.' : 'Mapped road limit · check local signs.'} ETA excludes traffic.</Text>}
  </View>;
}
