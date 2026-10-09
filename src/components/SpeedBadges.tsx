import React from 'react';
import { View, Text } from 'react-native';
import { Route, Fix, Vehicle } from '../core/types';
import { displaySpeed, freshFix, roadSpeedLimit } from '../core/rideView';
import { usePalette } from './ui';
export default function SpeedBadges({ route, fix, index, offRoute, now, unit, profile, simulation }: { route: Route | null; fix: Fix | null; index?: number; offRoute?: boolean; now: number; unit: 'km' | 'mi'; profile: Vehicle; simulation: boolean }) {
  const p = usePalette(), valid = freshFix(fix, now), speed = valid && fix?.speed !== null && fix?.speed !== undefined ? fix.speed * 3.6 : null, limit = valid && !offRoute ? roadSpeedLimit(route, index) : null;
  const number = (v: number | null) => v === null ? '—' : displaySpeed(v, unit).toFixed(0), u = unit === 'mi' ? 'mph' : 'km/h';
  const exceeded = speed !== null && speed > Math.min(profile.maxSpeed, profile.ridingLimit, limit ?? Infinity) + 1;
  return <View pointerEvents="none" style={{ gap: 12, alignItems: 'center', width: 84 }}><View accessibilityLabel={`${simulation ? 'Demo speed' : 'Current speed'} ${number(speed)} ${u}`} style={{ borderRadius: 18, backgroundColor: p.card, padding: 10, minWidth: 80, alignItems: 'center', boxShadow: '0 3px 12px #00000030' }}><Text style={{ color: exceeded ? '#E97C65' : p.text, fontWeight: '800', fontSize: 30 }}>{number(speed)}</Text><Text style={{ color: p.muted, fontSize: 10 }}>{simulation ? 'Demo · ' : ''}{u}</Text></View><View accessibilityLabel={`Mapped road speed limit ${limit === null ? 'unknown' : number(limit) + ' ' + u}`} style={{ width: 58, height: 58, borderRadius: 30, borderWidth: 5, borderColor: '#D85847', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px #00000025' }}><Text style={{ fontSize: 24, fontWeight: '800', color: '#162C35' }}>{number(limit)}</Text></View><Text style={{ backgroundColor: p.card, color: p.muted, padding: 5, borderRadius: 8, fontSize: 10 }}>{limit === null ? 'Limit unknown' : `Road · ${u}`}</Text></View>;
}
