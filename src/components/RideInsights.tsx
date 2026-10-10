import React from 'react';
import { Text, View } from 'react-native';
import { RecordedRide } from '../core/recordings';
import { rideInsights } from '../core/rideInsights';
import { distanceLeft, displaySpeed } from '../core/rideView';
import { styles, usePalette } from './ui';
export default function RideInsights({ rides, unit }: { rides: RecordedRide[]; unit: 'km' | 'mi' }) {
  const p = usePalette(), insights = rideInsights(rides); if (!insights) return null;
  const speedUnit = unit === 'mi' ? 'mph' : 'km/h';
  return <View style={[styles.card, { backgroundColor: p.card }]}><Text style={{ color: p.text, fontSize: 20, fontWeight: '800' }}>Ride insights</Text><Text style={{ color: p.muted }}>{insights.count} completed rides · {distanceLeft(insights.meters, unit)} recorded</Text><Text style={{ color: p.text }}>Typical trip · {distanceLeft(insights.averageMeters, unit)}</Text><Text style={{ color: p.text }}>Longest trip · {distanceLeft(insights.longestMeters, unit)}</Text><Text style={{ color: p.text }}>Overall pace · {displaySpeed(insights.overallSpeedKmh, unit).toFixed(1)} {speedUnit}</Text>{insights.vehicles.map(v => <Text key={v.id} style={{ color: p.muted }}>{v.name} · {v.count} rides · {displaySpeed(v.typicalSpeedKmh, unit).toFixed(1)} {speedUnit} observed overall pace</Text>)}<Text style={{ color: p.muted, fontSize: 12, lineHeight: 18 }}>Measured from precise GPS fixes and elapsed ride time, including stops. Gaps and poor GPS can undercount distance. With three qualifying rides on the same vehicle and speed cap, learned ETA uses its observed stop-inclusive pace. Disable it in Settings. Your speed limits stay unchanged.</Text></View>;
}
