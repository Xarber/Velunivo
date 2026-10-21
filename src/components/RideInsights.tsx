import DetailRow from './DetailRow';
import Text from './LocalizedText';
import React from 'react';
import {router} from 'expo-router';
import {t} from '../i18n/core';
import {View} from 'react-native';
import { RecordedRide } from '../core/recordings';
import { rideInsights } from '../core/rideInsights';
import { distanceLeft, displaySpeed } from '../core/rideView';
import { Button, styles, usePalette } from './ui';
export default function RideInsights({ rides, unit, details=false }: { rides: RecordedRide[]; unit: 'km' | 'mi'; details?:boolean }) {
  const p = usePalette(), insights = rideInsights(rides); if (!insights) return null;
  if(!details)return <Button title={t('Ride insights')} icon="stats-chart-outline" secondary onPress={()=>router.push('/offline/insights')}/>;
  const speedUnit = unit === 'mi' ? 'mph' : 'km/h';
  return <View style={[styles.card, { backgroundColor: p.card }]}><DetailRow icon="stats-chart-outline" heading><Text style={{ color: p.text, fontSize: 20, fontWeight: '800' }}>Ride insights</Text></DetailRow><DetailRow icon="map-outline"><Text style={{ color: p.muted }}>{insights.count} completed rides · {distanceLeft(insights.meters, unit)} recorded</Text></DetailRow><DetailRow icon="navigate-outline"><Text style={{ color: p.text }}>Typical trip · {distanceLeft(insights.averageMeters, unit)}</Text></DetailRow><DetailRow icon="flag-outline"><Text style={{ color: p.text }}>Longest trip · {distanceLeft(insights.longestMeters, unit)}</Text></DetailRow><DetailRow icon="speedometer-outline"><Text style={{ color: p.text }}>Overall pace · {displaySpeed(insights.overallSpeedKmh, unit).toFixed(1)} {speedUnit}</Text></DetailRow>{insights.vehicles.map(v => <DetailRow key={v.id} icon="bicycle-outline"><Text style={{ color: p.muted }}>{v.name} · {v.count} rides · {displaySpeed(v.typicalSpeedKmh, unit).toFixed(1)} {speedUnit} observed overall pace</Text></DetailRow>)}<DetailRow icon="information-circle-outline"><Text style={{ color: p.muted, fontSize: 12, lineHeight: 18 }}>Measured from precise GPS fixes and elapsed ride time, including stops. Gaps and poor GPS can undercount distance. With three qualifying rides on the same vehicle and speed cap, learned ETA uses its observed stop-inclusive pace. Disable it in Settings. Your speed limits stay unchanged.</Text></DetailRow></View>;
}
